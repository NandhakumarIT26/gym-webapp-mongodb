import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan }) => {
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        let scanner = null;
        let isMounted = true;

        // Small delay to bypass React Strict Mode double-invocation bug
        // which creates two scanner instances
        const initDelay = setTimeout(() => {
            if (!isMounted) return;

            scanner = new Html5QrcodeScanner(
                "gym-qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    if (isMounted) onScan(decodedText);
                },
                (error) => {
                    // Ignore general errors (e.g. no QR found in frame)
                }
            );
        }, 100);

        // Cleanup function to stop the scanner on unmount
        return () => {
            isMounted = false;
            clearTimeout(initDelay);
            if (scanner && scanner.getState && scanner.getState() !== 1) { // 1 = UNKNOWN/NOT_STARTED
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
            // Clean up DOM just in case
            const el = document.getElementById("gym-qr-reader");
            if (el) el.innerHTML = '';
        };
    }, []);

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div id="gym-qr-reader"></div>
            {scanError && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px' }}>{scanError}</p>}
            <style>{`
                #gym-qr-reader {
                    border: 2px solid var(--border) !important;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }
                #gym-qr-reader button {
                    background-color: var(--primary);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    margin: 8px;
                    font-family: inherit;
                }
                #gym-qr-reader a {
                    color: var(--primary);
                }
                #gym-qr-reader img {
                    display: none;
                }
                #gym-qr-reader select {
                    padding: 6px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    color: var(--text);
                }
            `}</style>
        </div>
    );
};

export default QRScanner;
