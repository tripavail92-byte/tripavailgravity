
import { useState } from 'react';
import { aiVerificationService } from '@/features/verification/services/aiVerificationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestKYC() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTest = async () => {
        setLoading(true);
        setLogs([]);
        addLog("Starting KYC Test with local assets...");

        try {
            // Asset URLs (served from public folder)
            const idFront = '/test-assets/id_front.png';
            const idBack = '/test-assets/id_back.png'; // Using back as selfie for test, or user meant front+back?
            // The user provided "front and back side of ... id card".
            // However, the verification flow requires ID + Selfie.
            // If we send "Back of ID" as "Selfie", the AI *should* fail the face match.
            // Let's test that specifically.
            
            addLog(`Analyzing ID Front: ${idFront}`);
            const idValidation = await aiVerificationService.validateIdCard(idFront, 'test-user', 'tour_operator');
            addLog(`ID Validation Result: ${JSON.stringify(idValidation, null, 2)}`);

            if (!idValidation.valid) {
                 addLog("❌ ID Validation Failed. Aborting.");
                 setLoading(false);
                 return;
            }

            addLog(`Running Face Match (Selfie = Back of ID [${idBack}])...`);
            // Intentionally using back of ID as selfie to see if it fails/passes as expected
            const faceMatch = await aiVerificationService.compareFaceToId(idFront, idBack, 'test-user', 'tour_operator');
            addLog(`Face Match Result: ${JSON.stringify(faceMatch, null, 2)}`);

            setResult({ idValidation, faceMatch });

        } catch (error: any) {
            addLog(`EXECUTION ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">KYC Debug Console</h1>
            
            <div className="grid grid-cols-2 gap-8">
                <Card className="p-4">
                    <h3 className="font-bold mb-2">ID Front (Asset 1)</h3>
                    <img src="/test-assets/id_front.png" className="w-full rounded-lg" alt="ID Front" />
                </Card>
                <Card className="p-4">
                    <h3 className="font-bold mb-2">Selfie / ID Back (Asset 2)</h3>
                    <img src="/test-assets/id_back.png" className="w-full rounded-lg" alt="Test Asset 2" />
                </Card>
            </div>

            <Button onClick={runTest} disabled={loading} size="lg" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Verification Test
            </Button>

            <div className="bg-gray-950 text-green-400 font-mono p-6 rounded-xl overflow-auto h-96 whitespace-pre-wrap">
                {logs.length === 0 ? "// Ready to scan..." : logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
