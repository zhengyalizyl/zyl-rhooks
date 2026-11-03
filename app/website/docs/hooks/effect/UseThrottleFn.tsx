import { useThrottleFn } from '@zyl-rhooks/hooks'
import { useRef, useState } from 'react'

export function UseThrottleFn() {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
    const moveTimesRef = useRef(0)
    const handledTimesRef = useRef(0)

    // 假装这里是一次开销很大的处理
    const { run } = useThrottleFn(
        (x: number, y: number) => {
            handledTimesRef.current += 1
            setPosition({ x, y })
        },
        { wait: 500 }
    )

    return (
        <div>
            <h1>UseThrottleFn</h1>
            <div
                onMouseMove={event => {
                    moveTimesRef.current += 1
                    run(event.clientX, event.clientY)
                }}
                style={{
                    padding: 24,
                    border: '1px dashed currentColor',
                    borderRadius: 4
                }}
            >
                在这个框里移动鼠标
            </div>
            <p>
                鼠标事件 {moveTimesRef.current} 次，实际处理 {handledTimesRef.current} 次（每 500ms 最多一次）
            </p>
            <p>最后记录的位置：{position ? `(${position.x}, ${position.y})` : '-'}</p>
        </div>
    )
}
