// app/(home)/layout.tsx
import Navbar from "@/components/home/Navbar";
import BodyWrapper from "@/components/home/BodyWrapper";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSidebar";
import Footer from "@/components/home/footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <BodyWrapper
        leftSidebar={<LeftSidebar />}
        rightSidebar={<RightSidebar />}
      >
        {children}
      </BodyWrapper>
      <Footer />
    </div>
  );
}