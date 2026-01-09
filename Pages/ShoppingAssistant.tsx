import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, ShoppingBag, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function ShoppingAssistant() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { speak } = useSpeech();

  const identifyProduct = async (file) => {
    setIsAnalyzing(true);
    setShowCamera(false);
    speak('Analyzing product. Please wait.');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person shop. Analyze this product image and provide:
        
        1. Product name and brand
        2. Product type/category (food, beverage, household item, etc.)
        3. Package size/quantity
        4. Key features or description
        5. Visible price (if any)
        6. Expiration date or best before date (if visible)
        7. Any important warnings or labels
        8. Nutritional highlights (for food items)
        
        Be detailed and helpful. If it's food, mention allergens if visible.`,
        file_urls: [file_url],
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            brand: { type: "string" },
            category: { type: "string" },
            size: { type: "string" },
            price: { type: "string" },
            description: { type: "string" },
            expiration_date: { type: "string" },
            warnings: {
              type: "array",
              items: { type: "string" }
            },
            nutritional_info: { type: "string" },
            full_description: { type: "string" }
          }
        }
      });

      setResult(analysis);
      speak(analysis.full_description, true);
    } catch (error) {
      console.error('Product identification error:', error);
      toast.error('Failed to identify product');
      speak('Sorry, I could not identify the product. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Assistant</h1>
            <p className="text-gray-600">Identify products instantly</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Identifying Product...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Scan Product
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
              <img src={imageUrl} alt="Scanned product" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Product Information</h2>
              </div>

              <div className="space-y-4">
                {result.brand && (
                  <div>
                    <p className="text-sm text-gray-600">Brand</p>
                    <p className="text-lg font-semibold text-gray-900">{result.brand}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-2xl font-bold text-gray-900">{result.product_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {result.category && (
                    <div className="p-3 bg-orange-50 rounded-xl">
                      <p className="text-sm text-orange-700 mb-1">Category</p>
                      <p className="font-semibold text-orange-900">{result.category}</p>
                    </div>
                  )}
                  {result.size && (
                    <div className="p-3 bg-orange-50 rounded-xl">
                      <p className="text-sm text-orange-700 mb-1">Size</p>
                      <p className="font-semibold text-orange-900">{result.size}</p>
                    </div>
                  )}
                </div>

                {result.price && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="text-sm text-green-700 mb-1">Price</p>
                    <p className="text-3xl font-bold text-green-900">{result.price}</p>
                  </div>
                )}

                {result.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-700 leading-relaxed">{result.description}</p>
                  </div>
                )}

                {result.expiration_date && (
                  <div className="p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Expiration Date</p>
                    <p className="font-semibold text-blue-900">{result.expiration_date}</p>
                  </div>
                )}

                {result.nutritional_info && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Nutritional Information</p>
                    <p className="text-gray-700">{result.nutritional_info}</p>
                  </div>
                )}

                {result.warnings?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <p className="font-semibold text-red-900 mb-2">Warnings & Allergens</p>
                    <ul className="space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index} className="text-red-800 flex gap-2">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => speak(result.full_description, true)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Repeat Information
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Shopping Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-orange-600">•</span>
                <span>Hold products steady in front of the camera</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-600">•</span>
                <span>Ensure labels and text are visible</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-600">•</span>
                <span>Ask store staff for help locating specific items</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-600">•</span>
                <span>Check expiration dates on perishable items</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={identifyProduct}
          onClose={() => setShowCamera(false)}
          continuous={true}
        />
      )}
    </div>
  );
}