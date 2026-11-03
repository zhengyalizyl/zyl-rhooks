import { useRefValue } from '@zyl-rhooks/hooks'
import { useEffect, useState } from 'react'

export function UseRefValue() {
    const [count, setCount] = useState(0)
    const countRef = useRefValue(count)
    const [logs, setLogs] = useState<string[]>([])

    // 依赖数组是空的，定时器只建一次；但读 ref 拿到的始终是最新的 count
    useEffect(() => {
        const timer = setInterval(() => {
            setLogs(prev => [`读到 ${countRef.current}`, ...prev].slice(0, 5))
        }, 1000)

        return () => clearInterval(timer)
    }, [countRef])

    return (
        <div>
            <h1>UseRefValue</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(prev => prev + 1)}>Increment</button>
            <p>定时器每秒读一次（只在挂载时创建了一个定时器）：</p>
            <ul>
                {logs.map((log, index) => (
                    <li key={`${log}-${index}`}>{log}</li>
                ))}
            </ul>
        </div>
    )
}
