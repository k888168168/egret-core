//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

module egret.web {

    var canvas = <HTMLCanvasElement>document.createElement("canvas");
    var context2d = canvas.getContext("2d");

    export class WebGLRenderContext implements sys.RenderContext {


        public constructor(canvas:HTMLCanvasElement) {
            this.canvas = canvas;
            canvas.addEventListener("webglcontextlost", (event)=> {
                this.onContextLost();
                event.preventDefault();
            }, false);
            canvas.addEventListener("webglcontextrestored", ()=> {
                this.reset();
            }, false);
            this.reset();
        }

        /**
         * webgl上下文丢失
         */
        private onContextLost():void {

        }

        /**
         * webgl上下文重新获取
         */
        private reset():void {
            var canvas = this.canvas;
            var gl = <WebGLRenderingContext>(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
            //gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            this.gl = gl;
            this.texture2DProgram = new Texture2DProgram(gl, canvas.width, canvas.height);
            this.initFramebuffer(canvas.width, canvas.height);
        }

        public resize(screenWidth:number, screenHeight:number):void {
            this.texture2DProgram.resize(screenWidth, screenHeight);
            var gl = this.gl;
            gl.viewport(0,0,screenWidth,screenHeight);

            var frameBuffer = this.frameBuffer;
            var renderBuffer = this.renderBuffer;
            var texture = this.fboTexture;

            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, screenWidth, screenHeight);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.createFBOVertices(screenWidth,screenHeight);
        }

        private gl:WebGLRenderingContext;
        private texture2DProgram:Texture2DProgram;
        private a:number = 1;
        private b:number = 0;
        private c:number = 0;
        private d:number = 1;
        private tx:number = 0;
        private ty:number = 0;
        private frameBuffer:WebGLFramebuffer;
        private fboTexture:WebGLTexture;
        private renderBuffer:WebGLRenderbuffer;
        private fboVertices:Float32Array;

        private initFramebuffer(width:number, height:number):void {
            var gl = this.gl;
            //创建帧缓冲区对象
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            //设置模板缓冲区
            var renderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
            //设置颜色缓冲区纹理
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.frameBuffer = frameBuffer;
            this.fboTexture = texture;
            this.renderBuffer = renderBuffer;
            this.createFBOVertices(width,height);
        }

        private createFBOVertices(width:number,height:number):void {
            var list = [
                0, height, 0, height, 1,
                0, 0, 0, 0, 1,
                width, height, width, height, 1,
                0, 0, 0, 0, 1,
                width, height, width, height, 1,
                width, 0, width, 0, 1
            ];
            this.fboVertices = new Float32Array(list);
        }


        private canvas:HTMLCanvasElement;
        /**
         * @private
         * 与绘图上线文关联的画布实例
         */
        public surface:sys.Surface;

        /**
         * @private
         * 设置新图像如何绘制到已有的图像上的规制
         */
        public globalCompositeOperation:string;
        /**
         * @private
         * 设置接下来绘图填充的整体透明度
         */
        public globalAlpha:number = 1;
        /**
         * @private
         * 用于表示剪切斜接的极限值的数字。
         * @default 10
         */
        public miterLimit:number;
        /**
         * @private
         * 指定如何绘制每一条线段末端的属性。有3个可能的值，分别是：<br/>
         * <ul>
         * <li>"butt": 线段末端以方形结束。</li>
         * <li>"round": 线段末端以圆形结束。</li>
         * <li>"square": 线段末端以方形结束，但是增加了一个宽度和线段相同，高度是线段厚度一半的矩形区域。</li>
         * </ul>
         * @default "butt"
         */
        public lineCap:string;
        /**
         * @private
         * 指定用于拐角的连接外观的类型,有3个可能的值，分别是：<br/>
         * <ul>
         * <li>"round": 圆角连接</li>
         * <li>"bevel": 斜角连接。</li>
         * <li>"miter": 尖角连接。当使用尖角模式时，还可以同时使用 miterLimit 参数限制尖角的长度。</li>
         * </ul>
         * @default "miter"
         */
        public lineJoin:string;
        /**
         * @private
         * 设置线条粗细，以像素为单位。设置为0，负数，Infinity 或 NaN 将会被忽略。
         * @default 1
         */
        public lineWidth:number;
        /**
         * @private
         * 设置要在图形边线填充的颜色或样式
         * @default "#000000"
         */
        public strokeStyle:any;
        /**
         * @private
         * 设置要在图形内部填充的颜色或样式
         * @default "#000000"
         */
        public fillStyle:any;
        /**
         * @private
         * 控制在缩放时是否对位图进行平滑处理。
         * @default true
         */
        public imageSmoothingEnabled:boolean;
        /**
         * @private
         * 文本的对齐方式的属性,有5个可能的值，分别是：<br/>
         * <ul>
         * <li>"left" 文本左对齐。</li>
         * <li>"right" 文本右对齐。</li>
         * <li>"center" 文本居中对齐。</li>
         * <li>"start" 文本对齐界线开始的地方 （对于从左向右阅读的语言使用左对齐，对从右向左的阅读的语言使用右对齐）。</li>
         * <li>"end" 文本对齐界线结束的地方 （对于从左向右阅读的语言使用右对齐，对从右向左的阅读的语言使用左对齐）。</li>
         * </ul>
         * @default "start"
         */
        public textAlign:string;
        /**
         * @private
         * 决定文字垂直方向的对齐方式。有6个可能的值，分别是：<br/>
         * <ul>
         * <li>"top" 文本基线在文本块的顶部。</li>
         * <li>"hanging" 文本基线是悬挂基线。</li>
         * <li>"middle" 文本基线在文本块的中间。</li>
         * <li>"alphabetic" 文本基线是标准的字母基线。</li>
         * <li>"ideographic" 文字基线是表意字基线；如果字符本身超出了alphabetic 基线，那么ideograhpic基线位置在字符本身的底部。</li>
         * <li>"bottom" 文本基线在文本块的底部。 与 ideographic 基线的区别在于 ideographic 基线不需要考虑下行字母。</li>
         * </ul>
         * @default "alphabetic"
         */
        public textBaseline:string;
        /**
         * @private
         * 当前的字体样式
         */
        public font:string;

        /**
         * @private
         *
         * @param text
         * @param x
         * @param y
         * @param maxWidth
         */
        public strokeText(text:string, x:number, y:number, maxWidth:number):void {

        }

        /**
         * @private
         * 绘制一段圆弧路径。圆弧路径的圆心在 (x, y) 位置，半径为 r ，根据anticlockwise （默认为顺时针）指定的方向从 startAngle 开始绘制，到 endAngle 结束。
         * @param x 圆弧中心（圆心）的 x 轴坐标。
         * @param y 圆弧中心（圆心）的 y 轴坐标。
         * @param radius 圆弧的半径。
         * @param startAngle 圆弧的起始点， x轴方向开始计算，单位以弧度表示。
         * @param endAngle 圆弧的重点， 单位以弧度表示。
         * @param anticlockwise 如果为 true，逆时针绘制圆弧，反之，顺时针绘制。
         */
        public arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, anticlockwise?:boolean):void {

        }

        /**
         * @private
         * 绘制一段二次贝塞尔曲线路径。它需要2个点。 第一个点是控制点，第二个点是终点。 起始点是当前路径最新的点，当创建二次贝赛尔曲线之前，可以使用 moveTo() 方法进行改变。
         * @param cpx 控制点的 x 轴坐标。
         * @param cpy 控制点的 y 轴坐标。
         * @param x 终点的 x 轴坐标。
         * @param y 终点的 y 轴坐标。
         */
        public quadraticCurveTo(cpx:number, cpy:number, x:number, y:number):void {

        }

        /**
         * @private
         * 使用直线连接子路径的终点到x，y坐标。
         * @param x 直线终点的 x 轴坐标。
         * @param y 直线终点的 y 轴坐标。
         */
        public lineTo(x:number, y:number):void {

        }

        /**
         * @private
         * 根据当前的填充样式，填充当前或已存在的路径的方法。采取非零环绕或者奇偶环绕规则。
         * @param fillRule 一种算法，决定点是在路径内还是在路径外。允许的值：
         * "nonzero": 非零环绕规则， 默认的规则。
         * "evenodd": 奇偶环绕规则。
         */
        public fill(fillRule?:string):void {

        }

        /**
         * @private
         * 使笔点返回到当前子路径的起始点。它尝试从当前点到起始点绘制一条直线。如果图形已经是封闭的或者只有一个点，那么此方法不会做任何操作。
         */
        public closePath():void {

        }

        /**
         * @private
         * 创建一段矩形路径，矩形的起点位置是 (x, y) ，尺寸为 width 和 height。矩形的4个点通过直线连接，子路径做为闭合的标记，所以你可以填充或者描边矩形。
         * @param x 矩形起点的 x 轴坐标。
         * @param y 矩形起点的 y 轴坐标。
         * @param width 矩形的宽度。
         * @param height 矩形的高度。
         */
        public rect(x:number, y:number, w:number, h:number):void {

        }

        /**
         * @private
         * 将一个新的子路径的起始点移动到(x，y)坐标
         * @param x 点的 x 轴
         * @param y 点的 y 轴
         */
        public moveTo(x:number, y:number):void {

        }

        /**
         * @private
         * 绘制一个填充矩形。矩形的起点在 (x, y) 位置，矩形的尺寸是 width 和 height ，fillStyle 属性决定矩形的样式。
         * @param x 矩形起始点的 x 轴坐标。
         * @param y 矩形起始点的 y 轴坐标。
         * @param width 矩形的宽度。
         * @param height 矩形的高度。
         */
        public fillRect(x:number, y:number, w:number, h:number):void {

        }

        /**
         * @private
         * 绘制一段三次贝赛尔曲线路径。该方法需要三个点。 第一、第二个点是控制点，第三个点是结束点。起始点是当前路径的最后一个点，
         * 绘制贝赛尔曲线前，可以通过调用 moveTo() 进行修改。
         * @param cp1x 第一个控制点的 x 轴坐标。
         * @param cp1y 第一个控制点的 y 轴坐标。
         * @param cp2x 第二个控制点的 x 轴坐标。
         * @param cp2y 第二个控制点的 y 轴坐标。
         * @param x 结束点的 x 轴坐标。
         * @param y 结束点的 y 轴坐标。
         */
        public bezierCurveTo(cp1x:number, cp1y:number, cp2x:number, cp2y:number, x:number, y:number):void {

        }

        /**
         * @private
         * 根据当前的画线样式，绘制当前或已经存在的路径的方法。
         */
        public stroke():void {

        }

        /**
         * @private
         * 使用当前的绘画样式，描绘一个起点在 (x, y) 、宽度为 w 、高度为 h 的矩形的方法。
         * @param x 矩形起点的 x 轴坐标。
         * @param y 矩形起点的 y 轴坐标。
         * @param width 矩形的宽度。
         * @param height 矩形的高度。
         */
        public strokeRect(x:number, y:number, w:number, h:number):void {

        }

        /**
         * @private
         * 清空子路径列表开始一个新路径。 当你想创建一个新的路径时，调用此方法。
         */
        public beginPath():void {

        }

        /**
         * @private
         * 根据控制点和半径绘制一段圆弧路径，使用直线连接前一个点。
         * @param x1 第一个控制点的 x 轴坐标。
         * @param y1 第一个控制点的 y 轴坐标。
         * @param x2 第二个控制点的 x 轴坐标。
         * @param y2 第二个控制点的 y 轴坐标。
         * @param radius 圆弧的半径。
         */
        public arcTo(x1:number, y1:number, x2:number, y2:number, radius:number):void {

        }

        /**
         * @private
         * 使用方法参数描述的矩阵多次叠加当前的变换矩阵。
         * @param a 水平缩放。
         * @param b 水平倾斜。
         * @param c 垂直倾斜。
         * @param d 垂直缩放。
         * @param tx 水平移动。
         * @param ty 垂直移动。
         */
        public transform(a:number, b:number, c:number, d:number, tx:number, ty:number):void {

        }

        /**
         * @private
         * 通过在网格中移动 surface 和 surface 原点 x 水平方向、原点 y 垂直方向，添加平移变换
         * @param x 水平移动。
         * @param y 垂直移动。
         */
        public translate(x:number, y:number):void {

        }

        /**
         * @private
         * 根据 x 水平方向和 y 垂直方向，为 surface 单位添加缩放变换。
         * @param x 水平方向的缩放因子。
         * @param y 垂直方向的缩放因子。
         */
        public scale(x:number, y:number):void {

        }

        /**
         * @private
         * 在变换矩阵中增加旋转，角度变量表示一个顺时针旋转角度并且用弧度表示。
         * @param angle 顺时针旋转的弧度。
         */
        public rotate(angle:number):void {

        }

        /**
         * @private
         * 恢复到最近的绘制样式状态，此状态是通过 save() 保存到”状态栈“中最新的元素。
         */
        public restore():void {

        }

        /**
         * @private
         * 使用栈保存当前的绘画样式状态，你可以使用 restore() 恢复任何改变。
         */
        public save():void {

        }

        /**
         * @private
         * 从当前路径创建一个剪切路径。在  clip() 调用之后，绘制的所有信息只会出现在剪切路径内部。
         */
        public clip(fillRule?:string):void {

        }

        /**
         * @private
         * 设置指定矩形区域内（以 点 (x, y) 为起点，范围是(width, height) ）所有像素变成透明，并擦除之前绘制的所有内容。
         * @param x 矩形起点的 x 轴坐标。
         * @param y 矩形起点的 y 轴坐标。
         * @param width 矩形的宽度。
         * @param height 矩形的高度。
         */
        public clearRect(x:number, y:number, width:number, height:number):void {
            var gl = this.gl;
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        /**
         * @private
         * 重新设置当前的变换为单位矩阵，并使用同样的变量调用 transform() 方法。
         * @param a 水平缩放。
         * @param b 水平倾斜。
         * @param c 垂直倾斜。
         * @param d 垂直缩放。
         * @param tx 水平移动。
         * @param ty 垂直移动。
         */
        public setTransform(a:number, b:number, c:number, d:number, tx:number, ty:number):void {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }

        /**
         * @private
         * 创建一个沿参数坐标指定的直线的渐变。该方法返回一个线性的 GraphicsGradient 对象。
         * @param x0 起点的 x 轴坐标。
         * @param y0 起点的 y 轴坐标。
         * @param x1 终点的 x 轴坐标。
         * @param y1 终点的 y 轴坐标。
         */
        public createLinearGradient(x0:number, y0:number, x1:number, y1:number):CanvasGradient {
            return context2d.createLinearGradient(x0, y0, x1, y1);
        }

        /**
         * @private
         * 根据参数确定的两个圆的坐标，创建一个放射性渐变。该方法返回一个放射性的 GraphicsGradient。
         * @param x0 开始圆形的 x 轴坐标。
         * @param y0 开始圆形的 y 轴坐标。
         * @param r0 开始圆形的半径。
         * @param x1 结束圆形的 x 轴坐标。
         * @param y1 结束圆形的 y 轴坐标。
         * @param r1 结束圆形的半径。
         */
        public createRadialGradient(x0:number, y0:number, r0:number, x1:number, y1:number, r1:number):CanvasGradient {
            return context2d.createRadialGradient(x0, y0, r0, x1, y1, r1);
        }

        /**
         * @private
         * 在(x,y)位置绘制（填充）文本。
         */
        public fillText(text:string, x:number, y:number, maxWidth?:number):void {

        }

        /**
         * @private
         * 测量指定文本宽度，返回 TextMetrics 对象。
         */
        public measureText(text:string):TextMetrics {
            return context2d.measureText(text);
        }

        private drawList:any = {};
        private textureList:any = {};
        private textureID:number[] = [];

        /**
         * @private
         * 注意：如果要对绘制的图片进行缩放，出于性能优化考虑，系统不会主动去每次重置imageSmoothingEnabled属性，因此您在调用drawImage()方法前请务必
         * 确保 imageSmoothingEnabled 已被重置为正常的值，否则有可能沿用上个显示对象绘制过程留下的值。
         */
        public drawImage(image:BitmapData, sourceX:number, sourceY:number, sourceWidth:number, sourceHeight:number,
                         targetX:number, targetY:number, targetWidth:number, targetHeight:number):void {
            var a = this.a, b = this.b, c = this.c, d = this.d, tx = this.tx, ty = this.ty;
            var alpha = this.globalAlpha;
            var hashCode = image.$hashCode;
            var list = this.drawList[hashCode];
            if (!list) {
                list = this.drawList[hashCode] = [];
                this.textureID.push(hashCode);
            }
            var index = list.length;
            list.push(
                sourceX, sourceY + sourceHeight, targetX, targetY + targetHeight, alpha,
                sourceX, sourceY, targetX, targetY, alpha,
                sourceX + sourceWidth, sourceY + sourceHeight, targetX + targetWidth, targetY + targetHeight, alpha,
                sourceX, sourceY, targetX, targetY, alpha,
                sourceX + sourceWidth, sourceY + sourceHeight, targetX + targetWidth, targetY + targetHeight, alpha,
                sourceX + sourceWidth, sourceY, targetX + targetWidth, targetY, alpha
            );

            for (var i = 0; i < 6; i++) {
                var x = list[index + 2];
                var y = list[index + 3];
                list[index + 2] = a * x + c * y + tx;
                list[index + 3] = b * x + d * y + ty;
                index += 5;
            }

            if (!this.textureList[hashCode]) {
                this.textureList[hashCode] = this.createTexture(image);
            }
        }

        /**
         * 结束绘制，提交渲染结果到GPU
         */
        public finish():void {
            var gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
            var drawList = this.drawList;
            this.drawList = {};
            var textureID = this.textureID;
            this.textureID = []
            var textureList = this.textureList;
            var program = this.texture2DProgram;
            var length = textureID.length;
            for (var i = 0; i < length; i++) {
                var hashCode = textureID[i];
                var list = drawList[hashCode];
                var texture = textureList[hashCode];
                program.drawTexture(texture, texture.width, texture.height, new Float32Array(list));
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
            var surface = this.surface;
            program.drawTexture(this.fboTexture, surface.width, surface.height, this.fboVertices,true);
        }

        private createTexture(image:any):WebGLTexture {
            var gl = this.gl;
            var texture:any = gl.createTexture();
            if (!texture) {
                log("failed to create the texture object!");
                return null;
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            texture.width = image.width;
            texture.height = image.height;
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        }

        /**
         * @private
         * 基于指定的源图象(BitmapData)创建一个模板，通过repetition参数指定源图像在什么方向上进行重复，返回一个GraphicsPattern对象。
         * @param bitmapData 做为重复图像源的 BitmapData 对象。
         * @param repetition 指定如何重复图像。
         * 可能的值有："repeat" (两个方向重复),"repeat-x" (仅水平方向重复),"repeat-y" (仅垂直方向重复),"no-repeat" (不重复).
         */
        public createPattern(image:BitmapData, repetition:string):CanvasPattern {
            return context2d.createPattern(<HTMLImageElement><any>image, repetition);
        }

        /**
         * @private
         * 返回一个 ImageData 对象，用来描述canvas区域隐含的像素数据，这个区域通过矩形表示，起始点为(sx, sy)、宽为sw、高为sh。
         */
        public getImageData(sx:number, sy:number, sw:number, sh:number):sys.ImageData {
            return <sys.ImageData><any>context2d.getImageData(sx, sy, sw, sh);
        }
    }
}