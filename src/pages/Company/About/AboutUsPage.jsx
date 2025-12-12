import WhyChooseUs from "../../Home/components/WhyChooseUs";
import AboutHero from "./component/AboutHero";
import AchievementsTimeline from "./component/AchievementsTimeline";
import BrandStory from "./component/BrandStory";
import CoreValues from "./component/CoreValues";
import FinalCTA from "./component/FinalCTA";
import MeetTheTeam from "./component/MeetTheTeam";
import MissionVision from "./component/MissionVision";
import SustainabilitySection from "./component/SustainabilitySection";

export default function AboutUsPage() {
  return (
    <div>
      <AboutHero />
      <BrandStory />
      <MissionVision />
      <CoreValues />
      <WhyChooseUs />
      <MeetTheTeam />
      <AchievementsTimeline />
      <SustainabilitySection />
      <FinalCTA />
    </div>
  );
}
