import React, { useState, useEffect, useRef } from "react";
import { loadStripe, Stripe, StripeElements, StripeCardElement } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentFormProps {
  clientKey: string | null;
  amount: number;
  onSuccess: (paymentMethod: string) => void;
  onError: (error: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientKey,
  amount,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientKey || !cardElementRef.current) return;

    const initStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          onError("Failed to load Stripe");
          return;
        }

        setStripe(stripeInstance);

        const elementsInstance = stripeInstance.elements({
          clientSecret: clientKey,
        });

        const cardElement = elementsInstance.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
          },
        });

        if (cardElementRef.current) {
          cardElement.mount(cardElementRef.current);
        }
        setElements(elementsInstance);

        cardElement.on('change', (event: any) => {
          if (event.error) {
            setCardError(event.error.message);
          } else {
            setCardError(null);
          }
        });
      } catch (error) {
        console.error('Stripe initialization error:', error);
        onError('Failed to initialize payment form');
      }
    };

    initStripe();
  }, [clientKey, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      onError("Stripe not initialized");
      return;
    }

    setLoading(true);
    setCardError(null);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement('card') as StripeCardElement,
    });

    if (error) {
      setCardError(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
    } else {
      onSuccess(paymentMethod.id);
    }

    setLoading(false);
  };

  if (!clientKey) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div ref={cardElementRef} className="p-3 border border-gray-300 rounded-lg"></div>
      
      {cardError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{cardError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay PHP ${amount.toLocaleString()}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;
