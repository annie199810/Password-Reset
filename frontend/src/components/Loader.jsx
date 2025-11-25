
import React from 'react';

export default function Loader({ size = 36 }) {
  return (
    <div style={{ display:'inline-block', verticalAlign:'middle' }}>
      <svg width={size} height={size} viewBox="0 0 50 50" aria-hidden>
        <path fill="none" stroke="rgba(123,97,255,0.15)" strokeWidth="6" d="M25 5 A20 20 0 0 1 45 25" strokeLinecap="round"/>
        <path fill="none" stroke="white" strokeWidth="6" d="M25 5 A20 20 0 0 1 45 25" strokeLinecap="round" style={{ stroke: 'url(#g)', transformOrigin: 'center' }}>
        </path>
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#7b61ff" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
