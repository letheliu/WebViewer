/********************************************************************************
 #                          OpenWebGlobe Version 1.x                            #
 #                              (c) 2010-2015 by                                #
 #           University of Applied Sciences Northwestern Switzerland            #
 #                     Institute of Geomatics Engineering                       #
 #                           martin.christen@fhnw.ch                            #
 ********************************************************************************
 *     Licensed under MIT License. Read the file LICENSE for more information   *
 *******************************************************************************/

goog.provide('owg.PointRenderer');

goog.require('goog.debug.Logger');
goog.require('owg.GeoCoord');
goog.require('owg.Texture');
goog.require('owg.mat4');

//------------------------------------------------------------------------------
/**
 * @class PointRenderer
 * @constructor
 *
 * @description class for rendering points / point clouds in geocentric
 *              cartesian coordinates
 *
 * @author Martin Christen martin.christen@fhnw.ch
 *
 * @param {engine3d} engine
 */
function PointRenderer(engine)
{
    /** @type {engine3d} */
    this.engine = engine;
    /** @type {WebGLRenderingContext} */
    this.gl = engine.gl;

    this.pointdata = null;
    this.vbo = null;

    this.offset = 0;
    this.numpoints = 0;
}
//------------------------------------------------------------------------------

/**
 * @description sets the point data
 * @param {String} pointsemantic the point semantic, use "pc" at the moment
 * @param {Float32Array} points the options object includes the center position as wgs84 and the point positions as x,y,z
 */
PointRenderer.prototype.SetPoints = function(pointsemantic, points)
{
    if (pointsemantic == "pc")
    {

        this.numpoints = points.length/7;
        this.pointdata = points;

        this._ToGPU();
    }
    else
    {
        goog.debug.Logger.getLogger('owg.PointRenderer').error("Point Semantic not supported!");
    }

}
//------------------------------------------------------------------------------

/**
 * @description frees all memory
 */
PointRenderer.prototype.Destroy = function()
{

    if (this.vbo)
    {
        this.gl.deleteBuffer(this.vbo);
        this.vbo = null;
    }
    this.pointdata = null;
    this.vbo = null;
}

//------------------------------------------------------------------------------


/**
 * @description draws the points.
 */
PointRenderer.prototype.Draw = function()
{
    if(this.pointdata != null)
    {
        //1. set points into gpu
        if(!this.vbo)
        {
            this._ToGPU();
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

        //3. activate shader and get attribute pointers
        this.gl.enableVertexAttribArray(0);
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 7*4, 0*4); // position
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 7*4, 3*4); // color
        var invmvp = new mat4();
        invmvp.Inverse(this.engine.matModelViewProjection);
        this.engine.shadermanager.UseShader_Point(this.engine.matModelViewProjection,invmvp);

        //4. draw the points
        this.gl.drawArrays(this.gl.POINTS,0,this.numpoints); //2=anzahl punkte

        this.gl.disableVertexAttribArray(0);
        this.gl.disableVertexAttribArray(1);
    }
}

//------------------------------------------------------------------------------
/**
 * @description internal function writes everything to the gpu
 */
PointRenderer.prototype._ToGPU = function()
{
    // Create VB
    if(this.vbo === null)
    {
        this.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.pointdata.length*4, this.gl.STATIC_DRAW);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER,0,this.pointdata);
    }
}

//------------------------------------------------------------------------------


