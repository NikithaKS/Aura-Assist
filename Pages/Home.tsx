import React, { useEffect, useState } from 'react';
import { Eye, Camera, DollarSign, Users, Navigation, ShoppingBag, AlertCircle, Palette, FileText, Map } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import VoiceController, { useSpeech } from '../components/VoiceController';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { speak } = useSpeech();
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    // Welcome message on first load
    if (!hasSpoken) {
      setTimeout(() => {
        speak('Welcome to Blind Assistance App. Tap any feature card or use voice commands like: analyze scene, detect currency, or recognize person. Say help for all commands.');
        setHasSpoken(true);
      }, 1000);
    }
  }, []);

  const handleVoiceCommand = (command) => {
    console.log('Command received:', command);

    // Scene Understanding
    if (command.includes('scene') || command.includes('describe') || command.includes('what do you see')) {
      speak('Opening scene analyzer');
      navigate('/SceneAnalysis');
    }
    // Currency Detection
    else if (command.includes('currency') || command.includes('money') || command.includes('cash')) {
      speak('Opening currency detector');
      navigate('/CurrencyDetector');
    }
    // People Recognition
    else if (command.includes('person') || command.includes('recognize') || command.includes('face')) {
      speak('Opening people recognition');
      navigate('/PeopleRecognition');
    }
    // Navigation
    else if (command.includes('navigate') || command.includes('direction') || command.includes('go to')) {
      speak('Opening navigation');
      navigate('/Navigation');
    }
    // Text Reader
    else if (command.includes('read') || command.includes('text') || command.includes('ocr')) {
      speak('Opening text reader');
      navigate('/TextReader');
    }
    // Color Detection
    else if (command.includes('color') || command.includes('colour')) {
      speak('Opening color detector');
      navigate('/ColorDetector');
    }
    // Shopping
    else if (command.includes('shop') || command.includes('product') || command.includes('barcode')) {
      speak('Opening shopping assistant');
      navigate('/ShoppingAssistant');
    }
    // Object Detection
    else if (command.includes('object') || command.includes('find') || command.includes('detect')) {
      speak('Opening object detector');
      navigate('/ObjectDetector');
    }
    // Settings
    else if (command.includes('setting') || command.includes('contact') || command.includes('emergency')) {
      speak('Opening settings');
      navigate('/Settings');
    }
    // Help
    else if (command.includes('help') || command.includes('command')) {
      speak('Available commands: analyze scene, detect currency, recognize person, navigate, read text, detect color, shopping assistant, object detector, or open settings. You can also tap any feature card.');
    }
  };

  const features = [
    {
      icon: Eye,
      title: 'Scene Analysis',
      description: 'Understand your surroundings with AI-powered scene description',
      color: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
      pageName: 'SceneAnalysis'
    },
    {
      icon: Camera,
      title: 'Object Detector',
      description: 'Identify objects around you in real-time',
      color: 'bg-gradient-to-br from-purple-600 to-purple-800',
      pageName: 'ObjectDetector'
    },
    {
      icon: DollarSign,
      title: 'Currency Detector',
      description: 'Identify money denominations instantly',
      color: 'bg-gradient-to-br from-green-600 to-green-800',
      pageName: 'CurrencyDetector'
    },
    {
      icon: Users,
      title: 'People Recognition',
      description: 'Remember and recognize familiar faces',
      color: 'bg-gradient-to-br from-blue-600 to-blue-800',
      pageName: 'PeopleRecognition'
    },
    {
      icon: FileText,
      title: 'Text Reader',
      description: 'Read text from images, documents, and signs',
      color: 'bg-gradient-to-br from-amber-600 to-amber-800',
      pageName: 'TextReader'
    },
    {
      icon: Palette,
      title: 'Color Detector',
      description: 'Identify colors of objects and clothing',
      color: 'bg-gradient-to-br from-pink-600 to-pink-800',
      pageName: 'ColorDetector'
    },
    {
      icon: Navigation,
      title: 'Navigation',
      description: 'Get voice-guided directions to your destination',
      color: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
      pageName: 'Navigation'
    },
    {
      icon: ShoppingBag,
      title: 'Shopping Assistant',
      description: 'Scan products and get instant information',
      color: 'bg-gradient-to-br from-orange-600 to-orange-800',
      pageName: 'ShoppingAssistant'
    },
    {
      icon: AlertCircle,
      title: 'Settings',
      description: 'Manage emergency contacts and preferences',
      color: 'bg-gradient-to-br from-gray-600 to-gray-800',
      pageName: 'Settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 mt-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blind Assistance</h1>
          <p className="text-lg text-gray-600">Your AI-powered vision companion</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="mt-8 p-6 bg-white rounded-3xl shadow-lg border-2 border-indigo-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Voice Commands</h2>
          <p className="text-gray-600 leading-relaxed">
            Tap the microphone button to enable voice control. Try saying: 
            <span className="font-semibold text-indigo-600"> "analyze scene"</span>, 
            <span className="font-semibold text-indigo-600"> "detect currency"</span>, or 
            <span className="font-semibold text-indigo-600"> "help"</span> for all commands.
          </p>
        </div>
      </div>

      <VoiceController onCommand={handleVoiceCommand} autoStart={false} />
    </div>
  );
}