import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Code2, Zap, Lock } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Uses Google Gemini API to generate intelligent metadata and captions for your images'
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'All processing is secure. Images are stored locally on your device'
    },
    {
      icon: Code2,
      title: 'Modern Tech Stack',
      description: 'Built with React, TypeScript, and Tailwind CSS for optimal performance'
    }
  ];

  const technologies = [
    { category: 'Frontend', tools: 'React 18, TypeScript, Vite, Tailwind CSS' },
    { category: 'AI', tools: 'Google Gemini API (gemini-1.5-flash)' },
    { category: 'Backend', tools: 'Node.js, Express, SQLite (JWT auth)' },
    { category: 'Storage', tools: 'Unsplash API, localStorage' },
    { category: 'UI Components', tools: 'shadcn/ui, Lucide Icons' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            About Image Muse
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            AI Image Metadata and Caption Generator is a powerful tool that uses artificial intelligence 
            to automatically generate intelligent metadata, captions, and descriptions for your images.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map(({ icon: Icon, title, description }, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Icon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { step: 1, title: 'Upload Images', desc: 'Select one or more images from your device' },
                { step: 2, title: 'AI Analysis', desc: 'Google Gemini API analyzes the image content' },
                { step: 3, title: 'Generate Metadata', desc: 'Automatic captions, tags, and descriptions are created' },
                { step: 4, title: 'Download Results', desc: 'Export images with watermarked captions or metadata' }
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                      <span className="text-white font-semibold text-sm">{step}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{title}</h4>
                    <p className="text-slate-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Technology Stack</CardTitle>
            <CardDescription>Built with modern web technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {technologies.map(({ category, tools }) => (
                <div key={category}>
                  <h4 className="text-white font-semibold mb-2">{category}</h4>
                  <p className="text-slate-400 text-sm">{tools}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Support & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-300">
              For help, documentation, or to report issues, visit our GitHub repository:
            </p>
            <a
              href="https://github.com/alanemohan/image-muse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg transition-all"
            >
              <Code2 size={18} />
              View on GitHub
              <ExternalLink size={16} />
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>AI Image Metadata and Caption Generator © 2026</p>
          <p className="mt-2">Made with passion for creators and developers</p>
        </div>
      </div>
    </div>
  );
};

export default About;
