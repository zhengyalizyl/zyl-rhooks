import { useRequest } from '@zyl-rhooks/hooks'

type User = { id: number; name: string }

// 假装是个接口：1 秒后返回，id 为 0 时报错
function fetchUser(id: number): Promise<User> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (id === 0) {
                reject(new Error('用户不存在'))
                return
            }

            resolve({ id, name: `用户 ${id}` })
        }, 1000)
    })
}

export function UseRequest() {
    const { data, error, loading, params, run, refresh, cancel, mutate } = useRequest(fetchUser, {
        defaultParams: [1]
    })

    const currentId = (params[0] as number | undefined) ?? 1

    return (
        <div>
            <h1>UseRequest</h1>
            <p>请求参数：id = {currentId}</p>
            <p>
                {loading && '加载中…'}
                {!loading && error && `出错了：${error.message}`}
                {!loading && !error && data && `${data.name}（id: ${data.id}）`}
            </p>
            <p>
                <button onClick={() => run(currentId + 1)}>下一个用户</button> <button onClick={refresh}>刷新</button>{' '}
                <button onClick={cancel}>取消本次请求</button>
            </p>
            <p>
                <button onClick={() => run(0)}>请求一个不存在的用户</button>{' '}
                <button onClick={() => mutate(old => (old ? { ...old, name: `${old.name}(改过)` } : old)!)}>直接改数据（不发请求）</button>
            </p>
        </div>
    )
}
