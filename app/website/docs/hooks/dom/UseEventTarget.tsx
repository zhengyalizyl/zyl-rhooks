import { useEffectWithTarget } from '@zyl-rhooks/hooks'
import { useRef, useState } from 'react'

export function UseEventTarget() {
    const boxRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [clicks, setClicks] = useState(0)
    const [bindTimes, setBindTimes] = useState(0)

    // ref 从 null 变成真实节点不会触发重渲染，普通 useEffect 的依赖数组里放 ref 是无效的；
    // useEffectWithTarget 每次渲染后重新解析 target，解析到元素才执行副作用
    useEffectWithTarget(element => {
        setBindTimes(prev => prev + 1)

        const onClick = () => setClicks(prev => prev + 1)
        element.addEventListener('click', onClick)

        return () => element.removeEventListener('click', onClick)
    }, boxRef)

    return (
        <div>
            <h1>UseEventTarget</h1>
            <button onClick={() => setMounted(prev => !prev)}>{mounted ? '卸载盒子' : '挂载盒子'}</button>
            {mounted && (
                <div
                    ref={boxRef}
                    style={{
                        marginTop: 8,
                        padding: 12,
                        border: '1px solid currentColor',
                        borderRadius: 4
                    }}
                >
                    点我
                </div>
            )}
            <p>盒子被点击：{clicks} 次</p>
            <p>事件绑定次数：{bindTimes}（反复渲染不会重复绑定）</p>
        </div>
    )
}
