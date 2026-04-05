const WebsiteInDevelopmentPage = () => {
  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="container-custom text-center max-w-2xl">
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Website under maintenance
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            We are working hard to bring you a fantastic online shopping
            experience. Stay tuned for updates and thank you for your patience!
          </p>
          {/* <p className="text-muted-foreground text-base sm:text-lg">
            In the mean time contact us at
            <div className="whats-app">
              <a href={buildWhatsAppLink()} target="_blank" rel="noreferrer">
                <strong>{WHATSAPP_DISPLAY_PHONE}</strong>
              </a>
            </div>
            to place an order or for any enquiries:
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default WebsiteInDevelopmentPage;
