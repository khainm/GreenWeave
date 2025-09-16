import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTopButton from '../components/ScrollToTopButton';
import ContactSection from '../components/ContactSection';
import ContactInfoSection from '../components/ContactInfoSection';
import ContactFormSection from '../components/ContactFormSection';
import ShowroomSection from '../components/ShowroomSection';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        <ContactSection />
        <ContactInfoSection />
        <ContactFormSection />
        <ShowroomSection />
      </main>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default ContactPage;
