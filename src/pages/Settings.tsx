import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RefreshCw } from 'lucide-react';

const Settings = () => {
  const clearStorage = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }, []);

  const resetBackground = useCallback(() => {
    sessionStorage.removeItem('cachedBackground');
    document.documentElement.style.removeProperty('--background-image');
    window.location.reload();
  }, []);

  const exportData = useCallback(() => {
    const images = localStorage.getItem('galleryImages');
    const dataStr = JSON.stringify(images, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-muse-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-400">Manage your application preferences and data</p>
        </div>

        <div className="space-y-6">
          {/* Data Management */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trash2 size={20} className="text-cyan-400" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your stored data and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Export Backup</h3>
                <p className="text-sm text-slate-400 mb-3">Download all your images as a backup file</p>
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300"
                >
                  Export Images
                </Button>
              </div>

              <div className="h-px bg-slate-700/50" />

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Clear All Data</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Delete all stored images and preferences. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/50"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-400">Clear All Data?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This will delete all your images and preferences. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearStorage}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <RefreshCw size={20} className="text-purple-400" />
                Display Settings
              </CardTitle>
              <CardDescription>Customize the appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Background Image</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Refresh the background image for a new random landscape
                </p>
                <Button
                  onClick={resetBackground}
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh Background
                </Button>
              </div>

              <div className="h-px bg-slate-700/50" />

              <div className="text-sm text-slate-400 space-y-2">
                <p>
                  <strong className="text-slate-300">Theme:</strong> Dark mode (always enabled)
                </p>
                <p>
                  <strong className="text-slate-300">Cache:</strong> Images are cached for optimal performance
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card className="bg-slate-900/50 border-cyan-700/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <RefreshCw size={20} className="text-cyan-400" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure your Gemini API access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Gemini API Key</h3>
                    <p className="text-sm text-slate-400 mb-3">
                        Enter your Google Gemini API key to enable AI features.
                    </p>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            placeholder="AIzaSy..."
                            className="bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white flex-1"
                            onChange={(e) => {
                                localStorage.setItem('gemini_api_key', e.target.value);
                            }}
                            defaultValue={localStorage.getItem('gemini_api_key') || ''}
                        />
                        <Button variant="secondary" onClick={() => window.location.reload()}>
                            Save
                        </Button>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>
                <strong className="text-slate-300">App Name:</strong> AI Image Metadata and Caption Generator
              </p>
              <p>
                <strong className="text-slate-300">Version:</strong> 1.0.0
              </p>
              <p>
                <strong className="text-slate-300">Built with:</strong> React, TypeScript, Tailwind CSS
              </p>
              <p>
                <strong className="text-slate-300">AI Engine:</strong> Google Gemini API
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
