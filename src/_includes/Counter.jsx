// Package modules.
import React, { useState } from 'react';

// Exports.
export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={ () => setCount((oldCount) => oldCount + 1) }>Add</button>
      <br />
      <span>Value: { count }</span>
    </div>
  );
}
