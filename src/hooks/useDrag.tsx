import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';

export type DragOffset = {
  x : number,
  y: number
}

type DragMinMax = {
  minX?: number,
  maxX?: number,
  minY?: number,
  maxY?: number
}

export const useDrag = (offset: DragOffset, setOffset: Dispatch<SetStateAction<DragOffset>>, minMax: DragMinMax | null = null, enabled = true) => {
  const clamp = (val: number, min: number | null = null, max: number | null = null) => {
    let ret = val;
    if (min != null) {
      ret = Math.max(ret, min);
    }

    if (max != null) {
      ret = Math.min(ret, max ?? Number.MIN_VALUE);
    }

    return ret;
  }

  const dragState = useRef({
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    curOffsetX: 0,
    curOffsetY: 0
  });

  useEffect(() => {
    const endListener = () => {
      dragState.current.isDragging = false;
    };
    const moveListener = (e: MouseEvent) => {
      if (dragState.current.isDragging) {
        e.stopPropagation();
        e.preventDefault();

        setOffset({
          x: clamp(e.screenX - dragState.current.dragStartX + dragState.current.curOffsetX, minMax?.minX, minMax?.maxX),
          y: clamp(e.screenY - dragState.current.dragStartY + dragState.current.curOffsetY, minMax?.minY, minMax?.maxY)
        });
      }
    }

    document.addEventListener('mouseup', endListener);
    document.addEventListener('mousemove', moveListener)

    return () => {
      document.removeEventListener('mouseup', endListener);
      document.removeEventListener('mousemove', moveListener);
    }
  }, [minMax]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent> | React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (enabled) {
      dragState.current.isDragging = true;
      dragState.current.dragStartX = e.screenX;
      dragState.current.dragStartY = e.screenY;
      dragState.current.curOffsetX = offset.x;
      dragState.current.curOffsetY = offset.y;
    }
  }, [offset, enabled]);

  return {
    onMouseDown
  }
};
