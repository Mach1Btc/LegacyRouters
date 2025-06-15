import React, { useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react';
import { explorer_url } from '@/lib/constants';

interface AddressCopyLinkProps {
    address: string
    copyButton?: boolean
    externalLink?: boolean
}

const AddressCopyLink: React.FC<AddressCopyLinkProps> = ({
    address,
    copyButton = true,
    externalLink = true
}) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
        }
    }

    return (
        <span className='flex flex-row items-center justify-center gap-1'>
            {!address ? ("Loading...") : (address)}

            {copyButton && (
                <button onClick={handleCopy} title="Copy address" className='cursor-pointer'>
                    {copied ? (
                        <Check className='text-green-600' height={10} width={10} />
                    ) : (
                        <Copy height={10} width={10} />
                    )}
                </button>
            )}

            {externalLink && (
                <a href={explorer_url + "/address/" + address} target='_blank'>
                    <ExternalLink height={10} width={10} />
                </a>
            )}
        </span>
    )
}

export default AddressCopyLink