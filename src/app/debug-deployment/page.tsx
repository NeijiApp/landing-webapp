"use client";

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { MobileAudioHandler } from '~/lib/audio/mobile-audio-handler';
import { BACKGROUND_NOISE_CONFIGS } from '~/lib/audio/background-noise';

export default function DebugDeploymentPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);

  const testDeploymentAudio = async () => {
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('/api/debug-deployment-audio');
      const data = await response.json();
      
      if (data.success) {
        setDeploymentInfo(data.data.deploymentInfo);
        setResults(data.data.results);
        
        // Log detailed results to console
        console.log('🎵 Deployment Audio Debug Results:', data.data);
      } else {
        setResults([{ error: data.error, details: data.details }]);
      }
    } catch (error) {
      console.error('Error testing deployment audio:', error);
      setResults([{ error: 'Failed to test deployment audio', details: error }]);
    }
    
    setLoading(false);
  };

  const testDirectAudioAccess = async () => {
    const audioFiles = BACKGROUND_NOISE_CONFIGS.map(config => config.file);
    const testResults = [];

    for (const filePath of audioFiles) {
      try {
        console.log('🎵 Testing direct audio access:', filePath);
        
        // Test with fetch
        const response = await fetch(filePath, { method: 'HEAD' });
        const fetchResult = {
          file: filePath,
          fetchStatus: response.status,
          fetchOk: response.ok,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        };

        // Test with Audio element
        const audio = new Audio(filePath);
        const audioTestResult = {
          audioError: null as any,
          audioReadyState: null as any,
          audioNetworkState: null as any,
        };

        audio.addEventListener('error', (e) => {
          console.error('🎵 Audio error for', filePath, ':', e);
          audioTestResult.audioError = {
            code: audio.error?.code,
            message: audio.error?.message,
          };
        });

        audio.addEventListener('canplaythrough', () => {
          console.log('🎵 Audio ready for', filePath);
          audioTestResult.audioReadyState = audio.readyState;
          audioTestResult.audioNetworkState = audio.networkState;
        });

        audio.addEventListener('loadstart', () => {
          console.log('🎵 Audio loading started for', filePath);
        });

        // Try to load the audio
        audio.load();
        
        testResults.push({
          ...fetchResult,
          ...audioTestResult,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error testing', filePath, ':', error);
        testResults.push({
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    setResults(testResults);
  };

  const testAudioPlayback = async (filePath: string) => {
    try {
      console.log('🎵 Testing audio playback for:', filePath);
      
      // Mark user interaction for mobile
      MobileAudioHandler.markUserInteraction();
      
      const audio = new Audio(filePath);
      audio.loop = false;
      audio.volume = 0.5;
      
      // Add event listeners
      audio.addEventListener('error', (e) => {
        console.error('🎵 Playback error:', e);
        setResults(prev => [...prev, {
          file: filePath,
          action: 'playback_test',
          success: false,
          error: audio.error?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        }]);
      });

      audio.addEventListener('canplaythrough', async () => {
        try {
          await audio.play();
          console.log('🎵 Audio playback successful:', filePath);
          setResults(prev => [...prev, {
            file: filePath,
            action: 'playback_test',
            success: true,
            timestamp: new Date().toISOString(),
          }]);
        } catch (playError) {
          console.error('🎵 Playback failed:', playError);
          setResults(prev => [...prev, {
            file: filePath,
            action: 'playback_test',
            success: false,
            error: playError instanceof Error ? playError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }]);
        }
      });

      audio.load();
    } catch (error) {
      console.error('Error testing playback:', error);
      setResults(prev => [...prev, {
        file: filePath,
        action: 'playback_test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const testMobileAudioStatus = () => {
    const status = MobileAudioHandler.getMobileAudioStatus();
    setResults(prev => [...prev, {
      action: 'mobile_status',
      ...status,
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Deployment Audio Debug</h1>
      
      {/* Deployment Info */}
      {deploymentInfo && (
        <div className="mb-6 p-4 bg-blue-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Deployment Environment</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(deploymentInfo, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <Button onClick={testDeploymentAudio} disabled={loading}>
          {loading ? 'Testing...' : 'Test Deployment Audio API'}
        </Button>
        <Button onClick={testDirectAudioAccess} variant="outline">
          Test Direct Audio Access
        </Button>
        <Button onClick={testMobileAudioStatus} variant="outline">
          Test Mobile Audio Status
        </Button>
      </div>

      {/* Individual Audio Tests */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Individual Audio Files</h2>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_NOISE_CONFIGS.map((config) => (
            <Button
              key={config.id}
              onClick={() => testAudioPlayback(config.file)}
              variant="outline"
              className="text-xs"
            >
              Test {config.name}
            </Button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          {results.map((result, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h3 className="font-medium">
                {result.file ? result.file.split('/').pop() : result.action}
              </h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
