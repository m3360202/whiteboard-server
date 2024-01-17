##when we upgrade fabrcisjs to latest version ,these function should be recovered to boardx version

##this is to fix the bug that some of the points will be na, with hammerjs, remove these points in this.\_points, then works.

    /**
     * On mouseup after drawing the path on contextTop canvas
     * we use the points captured to create an new fabric path object
     * and add it to the fabric canvas.
     */
    _finalizeAndAddPath: function() {
      // 
      var ctx = this.canvas.contextTop;
      ctx.closePath();

      // 
      let points=[];

      this._points.map((o)=>{
        if(!_.isNaN(o.x))  points.push(o);
      })

      this._points=points;

      // 

      if (this.decimate) {
        this._points = this.decimatePoints(this._points, this.decimate);
      }
      var pathData = this.convertPointsToSVGPath(this._points).join('');
      if (pathData === 'M 0 0 Q 0 0 0 0 L 0 0') {
        // do not create 0 width/height paths, as they are
        // rendered inconsistently across browsers
        // Firefox 4, for example, renders a dot,
        // whereas Chrome 10 renders nothing
        this.canvas.requestRenderAll();
        return;
      }


      var path = this.createPath(pathData);
      this.canvas.clearContext(this.canvas.contextTop);
      this.canvas.fire('before:path:created', { path: path });
      this.canvas.add(path);
      this.canvas.requestRenderAll();
      path.setCoords();
      this._resetShadow();


      // fire event 'path' created
      this.canvas.fire('path:created', { path: path });
    }

## use hammerjs tap to trigger draw event

    /**
     * Method that defines the actions when mouse is released on canvas.
     * The method resets the currentTransform parameters, store the image corner
     * position in the image object and render the canvas on top.
     * @private
     * @param {Event} e Event object fired on mouseup
     */
    __onMouseUp: function (e) {
      var target, transform = this._currentTransform,
          groupSelector = this._groupSelector, shouldRender = false,
          isClick = (!groupSelector || (groupSelector.left === 0 && groupSelector.top === 0));
      this._cacheTransformEventData(e);
      target = this._target;
      this._handleEvent(e, 'up:before');
      // if right/middle click just fire events and return
      // target undefined will make the _handleEvent search the target
      if (checkClick(e, RIGHT_CLICK)) {
        if (this.fireRightClick) {
          this._handleEvent(e, 'up', RIGHT_CLICK, isClick);
        }
        return;
      }

      if (checkClick(e, MIDDLE_CLICK)) {
        if (this.fireMiddleClick) {
          this._handleEvent(e, 'up', MIDDLE_CLICK, isClick);
        }
        this._resetTransformEventData();
        return;
      }

      if (this.isDrawingMode && this._isCurrentlyDrawing) {
        // this._onMouseUpInDrawingMode(e);
        return;
      }

      if (!this._isMainEvent(e)) {
        return;
      }
      if (transform) {
        this._finalizeCurrentTransform(e);
        shouldRender = transform.actionPerformed;
      }
      if (!isClick) {
        var targetWasActive = target === this._activeObject;
        this._maybeGroupObjects(e);
        if (!shouldRender) {
          shouldRender = (
            this._shouldRender(target) ||
            (!targetWasActive && target === this._activeObject)
          );
        }
      }
      if (target) {
        var corner = target._findTargetCorner(
          this.getPointer(e, true),
          fabric.util.isTouchEvent(e)
        );
        var control = target.controls[corner],
            mouseUpHandler = control && control.getMouseUpHandler(e, target, control);
        if (mouseUpHandler) {
          mouseUpHandler(e, target, control);
        }
        target.isMoving = false;
      }
      this._setCursorFromEvent(e, target);
      this._handleEvent(e, 'up', LEFT_CLICK, isClick);
      this._groupSelector = null;
      this._currentTransform = null;
      // reset the target information about which corner is selected
      target && (target.__corner = 0);
      if (shouldRender) {
        this.requestRenderAll();
      }
      else if (!isClick) {
        this.renderTop();
      }
    },



    /**
     * Method that defines the actions when mouse is clicked on canvas.
     * The method inits the currentTransform parameters and renders all the
     * canvas so the current image can be placed on the top canvas and the rest
     * in on the container one.
     * @private
     * @param {Event} e Event object fired on mousedown
     */
    __onMouseDown: function (e) {
      this._cacheTransformEventData(e);
      this._handleEvent(e, 'down:before');
      var target = this._target;
      // if right click just fire events
      if (checkClick(e, RIGHT_CLICK)) {
        if (this.fireRightClick) {
          this._handleEvent(e, 'down', RIGHT_CLICK);
        }
        return;
      }

      if (checkClick(e, MIDDLE_CLICK)) {
        if (this.fireMiddleClick) {
          this._handleEvent(e, 'down', MIDDLE_CLICK);
        }
        return;
      }

      if (this.isDrawingMode) {
        // this._onMouseDownInDrawingMode(e);
        return;
      }

      if (!this._isMainEvent(e)) {
        return;
      }

      // ignore if some object is being transformed at this moment
      if (this._currentTransform) {
        return;
      }

      var pointer = this._pointer;
      // save pointer for check in __onMouseUp event
      this._previousPointer = pointer;
      var shouldRender = this._shouldRender(target),
          shouldGroup = this._shouldGroup(e, target);
      if (this._shouldClearSelection(e, target)) {
        this.discardActiveObject(e);
      }
      else if (shouldGroup) {
        this._handleGrouping(e, target);
        target = this._activeObject;
      }

      if (this.selection && (!target ||
        (!target.selectable && !target.isEditing && target !== this._activeObject))) {
        this._groupSelector = {
          ex: pointer.x,
          ey: pointer.y,
          top: 0,
          left: 0
        };
      }

      if (target) {
        var alreadySelected = target === this._activeObject;
        if (target.selectable) {
          this.setActiveObject(target, e);
        }
        var corner = target._findTargetCorner(
          this.getPointer(e, true),
          fabric.util.isTouchEvent(e)
        );
        target.__corner = corner;
        if (target === this._activeObject && (corner || !shouldGroup)) {
          var control = target.controls[corner],
              mouseDownHandler = control && control.getMouseDownHandler(e, target, control);
          if (mouseDownHandler) {
            mouseDownHandler(e, target, control);
          }
          this._setupCurrentTransform(e, target, alreadySelected);
        }
      }
      this._handleEvent(e, 'down');
      // we must renderAll so that we update the visuals
      (shouldRender || shouldGroup) && this.requestRenderAll();
    },




    /**
     * Method that defines the actions when mouse is hovering the canvas.
     * The currentTransform parameter will define whether the user is rotating/scaling/translating
     * an image or neither of them (only hovering). A group selection is also possible and would cancel
     * all any other type of action.
     * In case of an image transformation only the top canvas will be rendered.
     * @private
     * @param {Event} e Event object fired on mousemove
     */
    __onMouseMove: function (e) {
      this._handleEvent(e, 'move:before');
      this._cacheTransformEventData(e);
      var target, pointer;

      if (this.isDrawingMode) {
        // this._onMouseMoveInDrawingMode(e);
        return;
      }

      if (!this._isMainEvent(e)) {
        return;
      }

      var groupSelector = this._groupSelector;

      // We initially clicked in an empty area, so we draw a box for multiple selection
      if (groupSelector) {
        pointer = this._pointer;

        groupSelector.left = pointer.x - groupSelector.ex;
        groupSelector.top = pointer.y - groupSelector.ey;

        this.renderTop();
      }
      else if (!this._currentTransform) {
        target = this.findTarget(e) || null;
        this._setCursorFromEvent(e, target);
        this._fireOverOutEvents(target, e);
      }
      else {
        this._transformObject(e);
      }
      this._handleEvent(e, 'move');
      this._resetTransformEventData();
    },

####this is to fix the selection color not transparent problem, comment the line to set haslostcontext as true
if (!options.cssOnly) {
this.\_setBackstoreDimension(prop, dimensions[prop]);
cssValue += 'px';
// this.hasLostContext = true;
}

#######remove the jsdom code of the fabricjs

##### add mtr2 control to object

```
  objectControls.mtr2 = new fabric.Control({
    x: 0,
    y: 0.5,
    actionHandler: controlsUtils.rotationWithSnapping,
    cursorStyleHandler: controlsUtils.rotationStyleHandler,
    offsetY: 40,
    withConnection: true,
    actionName: 'rotate',
  });
```

##### rewrite change textbox width function

```
  function changeWidth(eventData, transform, x, y) {
    var target = transform.target, localPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y),
        strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
        multiplier = isTransformCentered(transform) ? 2 : 1,
        oldWidth = target.width,
        newWidth = Math.abs(localPoint.x * multiplier / target.scaleX) - strokePadding,
        shapeScaleX = Math.abs((target.aCoords["tl"].x - target.aCoords["tr"].x)) / 138;
    target.set('shapeScaleX', shapeScaleX);
    target.set('width', Math.max(newWidth, 0));
    target.initDimensions();
    target.set('dirty', true);
    if (target.obj_type === 'WBTextbox') target.set('fixedScaleChange', false);
    return oldWidth !== newWidth;
  }
```

//change the renderAll function to make the selection box not be cleared because of renderAll
/\*\*
_ Renders both the top canvas and the secondary container canvas.
_ @return {fabric.Canvas} instance
_ @chainable
_/
renderAll: function () {

      if (this.contextTopDirty && !this._groupSelector && !this.isDrawingMode) {
        this.clearContext(this.contextTop);
        this.contextTopDirty = false;
      }

      var canvasToDrawOn = this.contextContainer;
      this.renderCanvas(canvasToDrawOn, this._chooseObjectsToRender());

        //  if (this.hasLostContext) {
          this.renderTopLayer(this.contextTop);
          // }
      return this;
    },

// change the default behavior for objects of keeping the ratio, but wbshapenotes, wbrectpanel

/\*\*

- Inspect event and fabricObject properties to understand if the scaling action
- @param {Event} eventData from the user action
- @param {fabric.Object} fabricObject the fabric object about to scale
- @return {Boolean} true if scale is proportional
  \*/
  function scaleIsProportional(eventData, fabricObject) {

  var canvas = fabricObject.canvas, uniScaleKey = canvas.uniScaleKey,
  uniformIsToggled = eventData[uniScaleKey];

        if(fabricObject && (fabricObject.obj_type === 'common' ||fabricObject.obj_type === 'WBShapeNotes' || fabricObject.obj_type === 'WBRectPanel') )
        {
          if(uniformIsToggled) return true;
          return false;
        }
        // return (canvas.uniformScaling && !uniformIsToggled) || (!canvas.uniformScaling && uniformIsToggled);

  return (canvas.uniformScaling && !uniformIsToggled) ||
  (!canvas.uniformScaling && uniformIsToggled);

}
