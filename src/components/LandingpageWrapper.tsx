export default function LandingpageWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <div className="relative flex size-full min-h-screen flex-col bg-green-200 group/design-root overflow-x-hidden" style={{fontFamily:'Manrope, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="@container flex flex-col items-center justify-center gap-8 h-screen overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}