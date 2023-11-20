import { use } from 'matter';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DrawThePerfectShapePixel } from '../../../../types/CoveyTownSocket';

type CanvasProps = {
  width?: string;
  height?: string;
  penColor: string;
  canPaint?: boolean;
  tracePixels: DrawThePerfectShapePixel[];
  backendPixels?: DrawThePerfectShapePixel[];
  frontendPixels?: DrawThePerfectShapePixel[];
  sendPixels?: (pixels: DrawThePerfectShapePixel[]) => void;
};

type Coordinate = {
  x: number;
  y: number;
};

const Canvas = (props: CanvasProps) => {
  const [isPainting, setIsPainting] = useState(false);
  const [mousePosition, setMousePosition] = useState<Coordinate | undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
    if (!canvasRef.current) {
      return;
    }

    const canvas: HTMLCanvasElement = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const coord: Coordinate = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    return coord;
  };

  const startPaint = useCallback((event: MouseEvent) => {
    const coordinates = getCoordinates(event);
    if (coordinates) {
      setIsPainting(true);
      setMousePosition(coordinates);
    }
  }, []);

  const drawLine = (originalMousePosition: Coordinate, newMousePosition: Coordinate) => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext('2d');
    if (context) {
      context.strokeStyle = props.penColor;
      context.lineJoin = 'round';
      context.lineWidth = 5;

      context.beginPath();
      context.moveTo(originalMousePosition.x, originalMousePosition.y);
      context.lineTo(newMousePosition.x, newMousePosition.y);

      context.stroke();
    }
  };

  const paint = useCallback(
    (event: MouseEvent) => {
      if (isPainting) {
        const newMousePosition = getCoordinates(event);
        if (props.sendPixels && props.frontendPixels && newMousePosition) {
          props.sendPixels([
            ...props.frontendPixels,
            { x: newMousePosition.x, y: newMousePosition.y },
          ]);
        }
        if (mousePosition && newMousePosition) {
          drawLine(mousePosition, newMousePosition);
          setMousePosition(newMousePosition);
        }
      }
    },
    [isPainting, mousePosition],
  );

  const exitPaint = useCallback(() => {
    setIsPainting(false);
  }, []);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (props.canPaint) {
      const handleMouseDown = (event: MouseEvent) => startPaint(event);
      const handleMouseMove = (event: MouseEvent) => paint(event);
      const handleMouseUp = () => exitPaint();
      const handleMouseLeave = () => exitPaint();

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [startPaint, paint, exitPaint, props.canPaint]);

  /**
   * Draw the initial canvas with the trace shape as the background
   */
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (props.tracePixels) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white'; // Set the fill style to red
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        for (const coordinate of props.tracePixels) {
          context.fillRect(coordinate.x * scaleX, coordinate.y * scaleY, 1, 1);
        }
      }
    }
  }, [props.tracePixels]);

  /**
   * Draw the backendPixels on the canvas
   */
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (props.tracePixels && props.backendPixels) {
      console.log('here');
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white'; // Set the fill style to red
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        for (const coordinate of props.tracePixels) {
          context.fillRect(coordinate.x * scaleX, coordinate.y * scaleY, 1, 1);
        }
        context.fillStyle = props.penColor; // Set the fill style to red
        for (const coordinate of props.backendPixels) {
          context.fillRect(coordinate.x * scaleX, coordinate.y * scaleY, 1, 1);
        }
      }
    }
  }, [props.tracePixels, props.backendPixels, props.penColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        height: '400px',
        width: '400px',
        border: '1px solid #000',

        marginBottom: '30px',
        backgroundColor: 'black',
        borderRadius: '10px',
      }}
    />
  );
};

export default Canvas;
