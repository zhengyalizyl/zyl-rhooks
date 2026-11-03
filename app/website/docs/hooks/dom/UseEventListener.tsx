import { useEventListener } from '@zyl-rhooks/hooks';
import { useRef, useState } from 'react';

export function UseEventListener() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  // 挂在 ref 上：只有点按钮才会触发
  useEventListener(
    'click',
    () => {
      setCount((prev) => prev + 1);
    },
    { target: buttonRef },
  );

  // 不传 target：默认挂在 window 上
  useEventListener('click', () => {
    setTotal((prev) => prev + 1);
  });

  return (
    <div>
      <h1>UseEventListener</h1>
      <button ref={buttonRef}>点我：{count}</button>
      <p>页面任意位置被点击：{total}</p>
    </div>
  );
}
