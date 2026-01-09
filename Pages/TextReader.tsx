import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function TextReader() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { speak } = useSpeech();

  const readText = async (file) => {
    setIsAnalyzing(true);
    setShowCamera(false);
    speak('Reading text. Please wait.');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person read text from an image. 
        Extract and read ALL visible text in the image.
        
        Format your response as:
        1. If text is found: Read it naturally as you would read to someone
        2. Mention the type of document (sign, label, letter, document, etc.)
        3. If multiple sections, organize logically (top to bottom, left to right)
        4. If no text: clearly state "No readable text found in this image"
        
        Be thorough and clear.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            text_found: { type: "boolean" },
            document_type: { type: "string" },
            extracted_text: { type: "string" },
            language: { type: "string" },
            reading: { type: "string" }
          }
        }
      });

      setResult(analysis);

      if (analysis.text_found) {
        speak(`I found text on a ${analysis.document_type}. ${analysis.reading}`, true);
      } else {
        speak('No readable text found in the image. Please try again with better lighting or focus.', true);
      }
    } catch (error) {
      console.error('Text reading error:', error);
      toast.error('Failed to read text');
      speak('Sorry, I could not read the text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Text Reader</h1>
            <p className="text-gray-600">Read text from images</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Reading Text...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Capture & Read Text
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-amber-200">
              <img src={imageUrl} alt="Captured document" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className={`rounded-2xl p-6 shadow-lg border-2 ${
              result.text_found ? 'bg-white border-amber-200' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-6 w-6 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {result.text_found ? 'Text Found' : 'No Text Detected'}
                </h2>
              </div>

              {result.text_found ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Document Type</p>
                    <p className="text-lg font-semibold text-gray-900">{result.document_type}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Extracted Text</p>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap font-mono">
                        {result.extracted_text}
                      </p>
                    </div>
                  </div>

                  {result.language && (
                    <p className="text-sm text-gray-600">Language: {result.language}</p>
                  )}

                  <Button
                    onClick={() => speak(result.reading, true)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    Read Again
                  </Button>
                </div>
              ) : (
                <p className="text-gray-700">
                  No readable text found. Ensure the text is clear, well-lit, and in focus.
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Reading Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Hold the camera steady parallel to the text</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Ensure good lighting without glare or shadows</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Get close enough so text is clear</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Works with signs, labels, documents, menus, and more</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={readText}
          onClose={() => setShowCamera(false)}
          continuous={true}
        />
      )}
    </div>
  );
}