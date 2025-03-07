export default function FAQ() {
  const faqs = [
    {
      question: "What is App Store Screenshot Generator?",
      answer:
        "App Screenshot Generator is a free tool that allows you to create professional-looking screenshots for your mobile app to use in App Store and Google Play listings. You can customize device frames, add text, and adjust various design elements.",
    },
    {
      question: "Which device models are supported?",
      answer:
        "We added iPhone, iPad, and Android devices which are commonly used when releasing mobile apps to stores. Supporting only vertical orientatation for now and we aim to regularly add new devices as needed by the app stores.",
    },
    {
      question: "Can I use my own fonts or customize the appearance further?",
      answer:
        "Right now, we only support Google Fonts. To use your own fonts, you can check the code on GitHub or submit a feature request for your use case.",
    },
    {
      question: "How do I save or export my screenshots?",
      answer:
        "Once you've created your screenshot design, you can download individual images or use our bulk export feature to generate screenshots for multiple devices at once.",
    },
    {
      question: "Is this tool completely free?",
      answer:
        "Yes, the App Store Screenshot Generator is completely free to use with no limitations on the number of screenshots you can create.",
    },
    {
      question: "Do I need design skills to use this tool?",
      answer:
        "Whether you're a developer, designer, marketer, product manager, or entrepreneur, you can quickly create great-looking screenshots for your mobile app.",
    },
  ];

  return (
    <section className="py-12 bg-gray-50" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
