"use client";

import { useEffect, useRef, useState } from "react";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export default function MiniSparkline({ data, width = 120, height = 32, color, showArea = true }: MiniSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;
  const strokeColor = color || (trend >= 0 ? "#10b981" : "#ef4444");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = 2;

    const points = data.map((v, i) => ({
      x: i * stepX,
      y: pad + (1 - (v - min) / range) * (height - pad * 2),
    }));

    // Area fill
    if (showArea) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, strokeColor + "30");
      gradient.addColorStop(1, strokeColor + "05");
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }, [data, width, height, strokeColor, showArea]);

  return <canvas ref={canvasRef} style={{ width, height }} className="block" />;
}
