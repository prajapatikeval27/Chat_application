import React from 'react'

function Message({sender, message, isSenderMe}) {
    return (
        <div className='bg-red-400 rounded flex flex-col gap-1 w-fit px-1 py-1'>
            <div className='flex justify-start px-1'><h6 className='text-[10px] font-medium'>{isSenderMe ? 'Me' : sender}</h6></div>
            <div className='px-2'>
                <div className='text-[13px]  px-2 font-light'>{message}</div>
            </div>
        </div>
    )
}

export default Message