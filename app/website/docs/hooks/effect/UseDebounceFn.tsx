import { useDebounceFn } from '@zyl-rhooks/hooks'
import { useRef, useState } from 'react'

export function UseDebounceFn() {
    const [keyword, setKeyword] = useState('')
    const [results, setResults] = useState<string[]>([])
    const inputTimesRef = useRef(0)
    const searchTimesRef = useRef(0)

    // 假装这里是一次搜索请求
    const { run, cancel, flush } = useDebounceFn(
        (value: string) => {
            searchTimesRef.current += 1
            setResults(prev => [`搜索「${value || '(空)'}」`, ...prev].slice(0, 5))
        },
        { wait: 500 }
    )

    return (
        <div>
            <h1>UseDebounceFn</h1>
            <input
                value={keyword}
                placeholder="连续输入试试"
                onChange={event => {
                    inputTimesRef.current += 1
                    setKeyword(event.target.value)
                    run(event.target.value)
                }}
            />
            <p>
                <button onClick={cancel}>取消本次</button> <button onClick={flush}>立即执行</button>
            </p>
            <p>
                输入 {inputTimesRef.current} 次，实际搜索 {searchTimesRef.current} 次（停止输入 500ms 后才搜）
            </p>
            <ul>
                {results.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                ))}
            </ul>
        </div>
    )
}
