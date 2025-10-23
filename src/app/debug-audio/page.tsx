"use client";

import { useState } from 'react';
import { Button } from '~/components/ui/button';

export default function DebugAudioPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testAudioFiles = async () => {
    setLoading(true);
    setResults([]);

    const audioFiles = [
      '/background-noise/ocean-waves.mp3',
      '/background-noise/rain-sounds.mp3',
      '/background-noise/focus-music.mp3',
      '/background-noise/relax-music.mp3'
    ];

    const testResults = [];

    for (const filePath of audioFiles) {
      try {
        console.log('Testing file:', filePath);
        
        // Test with fetch first
        const response = await fetch(filePath, { method: 'HEAD' });
        console.log('Fetch result:', response.status, response.ok);
        
        // Test with Audio element
        const audio = new Audio(filePath);
        
        const testResult = {
          file: filePath,
          fetchStatus: response.status,
          fetchOk: response.ok,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          audioError: null as { code: number | undefined; message: string | undefined } | null,
          audioReadyState: null as number | null,
        };

        audio.addEventListener('error', (e) => {
          console.error('Audio error for', filePath, ':', e);
          testResult.audioError = {
            code: audio.error?.code,
            message: audio.error?.message,
          };
        });

        audio.addEventListener('canplaythrough', () => {
          console.log('Audio ready for', filePath);
          testResult.audioReadyState = audio.readyState;
        });

        audio.addEventListener('loadstart', () => {
          console.log('Audio loading started for', filePath);
        });

        // Try to load the audio
        audio.load();
        
        testResults.push(testResult);
      } catch (error) {
        console.error('Error testing', filePath, ':', error);
        testResults.push({
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const testApiEndpoint = async () => {
    try {
      const response = await fetch('/api/test-audio-files');
      const data = await response.json();
      console.log('API test result:', data);
      setResults(data.data?.results || []);
    } catch (error) {
      console.error('API test error:', error);
    }
  };

  const testDeploymentEndpoint = async () => {
    try {
      const response = await fetch('/api/debug-audio-deployment');
      const data = await response.json();
      console.log('Deployment debug result:', data);
      setResults(data.data?.results || []);
    } catch (error) {
      console.error('Deployment debug error:', error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Audio Files Debug</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testAudioFiles} disabled={loading}>
          {loading ? 'Testing...' : 'Test Audio Files Directly'}
        </Button>
        <Button onClick={testApiEndpoint} variant="outline">
          Test via API Endpoint
        </Button>
        <Button onClick={testDeploymentEndpoint} variant="outline">
          Test Deployment Debug
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          {results.map((result, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h3 className="font-medium">{result.file}</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

