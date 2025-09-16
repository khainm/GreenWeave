import React from 'react';
import Header from '../components/layout/Header';
import HeroSection from '../components/HeroSection';
import SustainabilityIntro from '../components/SustainabilityIntro';
import ScrollToTopButton from '../components/ui/ScrollToTopButton';
import GreenChoiceSection from '../components/GreenChoiceSection';
import FeaturedProducts from '../components/products/FeaturedProducts';
import AboutStorySection from '../components/AboutStorySection';
import CallToActionSection from '../components/CallToActionSection';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {


  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <SustainabilityIntro />
      <ScrollToTopButton />
      <GreenChoiceSection />
      <FeaturedProducts />
      <AboutStorySection />
      <CallToActionSection />
      <Footer />
    </div>
  );
};

export default HomePage;
