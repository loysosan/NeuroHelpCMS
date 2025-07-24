import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  role: 'client' | 'psychologist' | '';

  // Psychologist specific
  telegram?: string;
  instagram?: string;
  country?: string;
  city?: string;
  street?: string;
  house?: string;
  fullDescription?: string;
  shortDescription?: string;
  skills?: string[];
  photo?: File | null;
  videoUrl?: string;
}

const QuizRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    role: '',
    telegram: '',
    instagram: '',
    country: '',
    city: '',
    street: '',
    house: '',
    fullDescription: '',
    shortDescription: '',
    skills: [],
    photo: null,
    videoUrl: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const handleRoleSelect = (role: 'client' | 'psychologist') => {
    // We create the new state and pass it to the submit function directly
    // because setState is asynchronous.
    const newFormData = { ...formData, role };
    setFormData(newFormData);

    if (role === 'client') {
        handleSubmitQuiz(undefined, newFormData);
    } else {
        setStep(step + 1);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmitQuiz = async (e?: React.FormEvent, data: RegistrationData = formData) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    // The backend expects JSON, so we send the form data as a JSON string.
    // File uploads need to be handled in a separate request.
    const submissionData = { ...data };
    delete submissionData.photo;


    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      navigate('/registration-success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Name, Phone
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 1: Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      case 2: // Email, Password
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 2: Account Credentials</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      case 3: // Role
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 3: Choose Your Role</h3>
            <div className="flex flex-col space-y-4">
              <button type="button" onClick={() => handleRoleSelect('psychologist')} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                I am a specialist
              </button>
              <button type="button" onClick={() => handleRoleSelect('client')} className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                I am looking for a specialist
              </button>
            </div>
          </>
        );
      // Psychologist steps
      case 4: // Contacts
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 4: Contact Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telegram (optional)</label>
              <input type="text" name="telegram" value={formData.telegram} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram (optional)</label>
              <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      case 5: // Address
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 5: Address</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street & House</label>
              <input type="text" name="street" value={formData.street} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      case 6: // Descriptions
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 6: Professional Profile</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Short Description (max 250 chars)</label>
              <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} maxLength={250} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Description (max 2500 chars)</label>
              <textarea name="fullDescription" value={formData.fullDescription} onChange={handleChange} maxLength={2500} rows={6} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      case 7: // Media
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900 text-center">Step 7: Media</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
              <input type="file" name="photo" onChange={handleFileChange} accept="image/*" required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Video Presentation (YouTube URL)</label>
              <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </>
        );
      default:
        return <div>Thank you for registering!</div>;
    }
  };

  const isLastStep = formData.role === 'psychologist' && step === 7;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmitQuiz} className="space-y-6">
            {renderStep()}

            <div className="flex items-center justify-between mt-6">
              {step > 1 && step !== 3 && (
                <button type="button" onClick={prevStep} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Back
                </button>
              )}
              {step < 3 && (
                 <button type="button" onClick={nextStep} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ml-auto">
                   Next
                 </button>
              )}
              {step > 3 && formData.role === 'psychologist' && !isLastStep && (
                <button type="button" onClick={nextStep} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ml-auto">
                  Next
                </button>
              )}
              {isLastStep && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ml-auto"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizRegistrationForm;
