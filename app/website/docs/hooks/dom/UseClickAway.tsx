import { useClickAway } from '@zyl-rhooks/hooks'
import { useRef, useState } from 'react'

export function UseClickAway() {
    const [open, setOpen] = useState(false)
    const [counter, setCounter] = useState(0)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // 按钮本身也算「内部」，否则点按钮会先被判成点击外部，和 onClick 互相打架
    useClickAway(() => {
        setOpen(false)
        setCounter(prev => prev + 1)
    }, [buttonRef, panelRef])

    return (
        <div>
            <h1>UseClickAway</h1>
            <button ref={buttonRef} onClick={() => setOpen(prev => !prev)}>
                {open ? '收起面板' : '展开面板'}
            </button>
            {open && (
                <div
                    ref={panelRef}
                    style={{
                        marginTop: 8,
                        padding: 12,
                        border: '1px solid currentColor',
                        borderRadius: 4
                    }}
                >
                    点面板里面不会关闭，点页面其它地方会自动关闭。
                </div>
            )}
            <p>自动关闭次数：{counter}</p>
        </div>
    )
}
