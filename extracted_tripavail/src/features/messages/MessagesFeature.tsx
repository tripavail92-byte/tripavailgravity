// Messages Feature Component
import { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedMessageIcon } from '../../components/icons/AnimatedMessageIcon';
import { dataService } from '../../services/dataService';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../lib/constants';

export function MessagesFeature() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await dataService.submitContactForm(formData);
      
      if (response.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AnimatedMessageIcon className="w-12 h-12 text-purple-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Messages & Support</h1>
        <p className="text-gray-600">Get help with your bookings and travel plans</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <button className="p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-center">
          <div className="font-medium">Live Chat</div>
          <div className="text-sm opacity-75">Get instant help</div>
        </button>
        <button className="p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-center">
          <div className="font-medium">FAQ Center</div>
          <div className="text-sm opacity-75">Find quick answers</div>
        </button>
        <button className="p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-center">
          <div className="font-medium">Call Support</div>
          <div className="text-sm opacity-75">Speak with an agent</div>
        </button>
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a subject</option>
              <option value="booking-inquiry">Booking Inquiry</option>
              <option value="booking-modification">Booking Modification</option>
              <option value="cancellation">Cancellation</option>
              <option value="technical-support">Technical Support</option>
              <option value="feedback">Feedback</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Describe your inquiry or issue in detail..."
            />
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {SUCCESS_MESSAGES.CONTACT_SENT}
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {ERROR_MESSAGES.GENERIC}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </motion.div>

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        <p>We typically respond within 24 hours during business days.</p>
        <p className="mt-1">For urgent matters, please use our live chat or call support.</p>
      </motion.div>
    </div>
  );
}