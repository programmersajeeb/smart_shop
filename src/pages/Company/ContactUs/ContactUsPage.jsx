import React from 'react';
import ContactHero from './component/ContactHero';
import ContactInfoCards from './component/ContactInfoCards';
import SupportCategories from './component/SupportCategories';
import FAQSection from './component/FAQSection';
import StoreLocationSection from './component/StoreLocationSection';
import ContactFormSection from './component/ContactFormSection';
import FinalContactCTA from './component/FinalContactCTA';
import SocialMediaLinks from './component/SocialMediaLinks';

export default function ContactUsPage() {
  return (
    <div>
      <ContactHero />
      <ContactInfoCards />
      <SupportCategories />
      <FAQSection />
      <StoreLocationSection />
      <ContactFormSection />
      <FinalContactCTA />
      <SocialMediaLinks />
    </div>
  );
}
