/**
 * AI health analysis logic for RapiReport.
 * In a real application, this would call an LLM API (like Gemini).
 */

export const analyzeHealthReport = (profile, tests) => {
  const insights = [];
  const riskFactors = [];

  // Example logic for bilingual output
  const isElderly = profile.age > 60;

  // Hemoglobin check
  const hemoglobin = tests.find((t) =>
    t.name.toLowerCase().includes("hemoglobin"),
  );
  if (hemoglobin && hemoglobin.status === "low") {
    insights.push({
      en: "Your iron levels are low, which can cause fatigue. Focus on iron-rich foods.",
      ne: "तपाईंको शरीरमा आइरनको मात्रा कम छ, जसले गर्दा थकाई लाग्न सक्छ। आइरनयुक्त खानामा जोड दिनुहोस्।",
    });
  }

  // Blood sugar check
  const sugar = tests.find(
    (t) =>
      t.name.toLowerCase().includes("sugar") ||
      t.name.toLowerCase().includes("glucose"),
  );
  if (sugar && sugar.status === "high") {
    if (profile.conditions?.includes("Diabetes")) {
      insights.push({
        en: "Your glucose is high. Please adhere strictly to your diabetic medication.",
        ne: "तपाईंको रगतमा चिनीको मात्रा उच्च छ। कृपया आफ्नो मधुमेहको औषधि नियमित रूपमा लिनुहोस्।",
      });
    } else {
      insights.push({
        en: "Elevated glucose detected. Reduce refined sugar and monitor levels.",
        ne: "रगतमा चिनीको मात्रा बढी देखिएको छ। चिनीजन्य खाना कम गर्नुहोस् र निगरानी गर्नुहोस्।",
      });
    }
  }

  // Parental History logic
  if (
    profile.parentalHistory?.includes("Heart Disease") &&
    sugar?.status === "high"
  ) {
    riskFactors.push({
      en: "Family history of heart disease combined with high glucose increases cardiovascular risk. Solution: Monitor lipids quarterly and switch to heart-healthy fats.",
      ne: "परिवारमा मुटुको रोगको इतिहास र उच्च सुगरले मुटुसम्बन्धी जोखिम बढाउन सक्छ। समाधान: प्रत्येक तीन महिनामा लिपिड परीक्षण गर्नुहोस् र मुटुका लागि स्वस्थ बोसो खानुहोस्।",
    });
  }

  if (profile.parentalHistory?.includes("Thyroid")) {
    riskFactors.push({
      en: "Hereditary thyroid predisposition noted. Solution: Include iodized salt and regular thyroid function tests (T3, T4, TSH).",
      ne: "थाइराइडको वंशाणुगत जोखिम देखिएको छ। समाधान: आयोडिनयुक्त नुनको प्रयोग गर्नुहोस् र नियमित थाइराइड परीक्षण गर्नुहोस्।",
    });
  }

  if (profile.parentalHistory?.includes("BP")) {
    riskFactors.push({
      en: "Increased risk of hypertension due to family history. Solution: Reduce sodium intake and maintain a daily 30-minute walk routine.",
      ne: "पारिवारिक इतिहासका कारण उच्च रक्तचापको जोखिम बढी छ। समाधान: नुनको प्रयोग कम गर्नुहोस् र दैनिक ३० मिनेट हिँड्ने बानी बसाल्नुहोस्।",
    });
  }

  return { insights, riskFactors };
};

export const getDailyActivities = (profile) => {
  const activities = [
    {
      id: "water_intake",
      en: "Drink at least 3 liters of water",
      ne: "दिनमा कम्तिमा ३ लिटर पानी पिउनुहोस्",
      time: "All Day",
      verificationType: "image",
    },
  ];

  if (profile.age > 50) {
    activities.push({
      id: "evening_walk",
      en: "15-minute gentle evening walk",
      ne: "बेलुका १५ मिनेट हलुका हिँड्नुहोस्",
      time: "Evening",
      verificationType: "location",
    });
  } else {
    activities.push({
      id: "morning_exercise",
      en: "30-minute brisk morning exercise",
      ne: "बिहान ३० मिनेट छिटो हिँड्ने वा व्यायाम गर्नुहोस्",
      time: "Morning",
      verificationType: "location",
    });
  }

  if (profile.conditions?.includes("BP")) {
    activities.push({
      id: "bp_check",
      en: "Monitor blood pressure and limit salt",
      ne: "रक्तचाप जाँच्नुहोस् र नुन कम खानुहोस्",
      time: "Daily",
      verificationType: "check",
    });
  }

  return activities;
};
