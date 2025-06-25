// pages/index.tsx
import { useState, ChangeEvent, JSX } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { MessageExport, MessageAnalysis } from "../types/message";

export default function Home(): JSX.Element {
  const [uploadedData, setUploadedData] = useState<MessageExport | null>(null);
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data: MessageExport = JSON.parse(text);

      // Validate the data structure
      if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error("Invalid file format. Expected messages array.");
      }

      setUploadedData(data);

      // Send to analysis endpoint
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const analysisResult: MessageAnalysis = await response.json();
      setAnalysis(analysisResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("File processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadShortcut = (): void => {
    window.open("/api/shortcut-download", "_blank");
  };

  const resetApp = (): void => {
    setUploadedData(null);
    setAnalysis(null);
    setError(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeRangeText = (analysis: MessageAnalysis): string => {
    if (!analysis.firstMessageDate || !analysis.lastMessageDate) return "";
    const start = formatDate(analysis.firstMessageDate);
    const end = formatDate(analysis.lastMessageDate);
    return `${start} - ${end}`;
  };

  const getSentimentLabel = (score: number): string => {
    if (score > 0.33) return "Positive";
    if (score < -0.33) return "Negative";
    return "Neutral";
  };

  const getSentimentColor = (score: number): string => {
    if (score > 0.33) return "#4CAF50";
    if (score < -0.33) return "#f44336";
    return "#9E9E9E";
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Advanced Text Message Analyzer</title>
        <meta
          name="description"
          content="Comprehensive analysis of your iOS text messages"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>📱 Advanced iOS Text Message Analyzer</h1>
        <p className={styles.subtitle}>
          Get deep insights into your messaging patterns, sentiment, and
          communication habits
        </p>

        <div className={styles.steps}>
          <h2>Step 1: Download the iOS Shortcut</h2>
          <p>
            This Shortcut will extract your messages and format them for
            comprehensive analysis.
          </p>
          <button onClick={downloadShortcut} className={styles.downloadBtn}>
            📥 Download iOS Shortcut
          </button>

          <div className={styles.instructions}>
            <h3>Installation Instructions:</h3>
            <ol>
              <li>Tap the download button above on your iPhone</li>
              <li>When prompted, tap &quot;Get Shortcut&quot;</li>
              <li>
                Open the Shortcuts app and find &quot;Export Messages&quot;
              </li>
              <li>Tap the shortcut to run it</li>
              <li>Grant permission to access Messages</li>
              <li>Choose your export options (date range, contacts)</li>
              <li>The shortcut will create a JSON file in your Files app</li>
            </ol>
          </div>
        </div>

        <div className={styles.steps}>
          <h2>Step 2: Upload Your Exported Messages</h2>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className={styles.fileInput}
            disabled={loading}
          />

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>
                🔍 Analyzing your messages... This may take a moment for large
                datasets.
              </p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>❌ Error: {error}</p>
              <button onClick={resetApp} className={styles.resetBtn}>
                Try Again
              </button>
            </div>
          )}

          {uploadedData && !error && (
            <div className={styles.uploadSuccess}>
              <p>
                ✅ Successfully loaded{" "}
                {uploadedData.messages.length.toLocaleString()} messages
              </p>
            </div>
          )}
        </div>

        {analysis && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <h2>📊 Your Message Analysis Report</h2>
              <p className={styles.timeRange}>
                📅 Analysis Period: {getTimeRangeText(analysis)}
              </p>
            </div>

            {/* Overview Stats */}
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <div className={styles.overviewIcon}>💬</div>
                <div className={styles.overviewContent}>
                  <h3>Total Messages</h3>
                  <p className={styles.overviewNumber}>
                    {analysis.totalMessages.toLocaleString()}
                  </p>
                  <small>{analysis.averagePerDay} per day average</small>
                </div>
              </div>

              <div className={styles.overviewCard}>
                <div className={styles.overviewIcon}>👤</div>
                <div className={styles.overviewContent}>
                  <h3>Most Active Contact</h3>
                  <p className={styles.overviewNumber}>
                    {analysis.mostActiveContact}
                  </p>
                  <small>
                    {analysis.contactCounts[analysis.mostActiveContact]}{" "}
                    messages
                  </small>
                </div>
              </div>

              <div className={styles.overviewCard}>
                <div className={styles.overviewIcon}>😊</div>
                <div className={styles.overviewContent}>
                  <h3>Overall Sentiment</h3>
                  <p
                    className={styles.overviewNumber}
                    style={{
                      color: getSentimentColor(analysis.averageSentiment),
                    }}
                  >
                    {getSentimentLabel(analysis.averageSentiment)}
                  </p>
                  <small>Score: {analysis.averageSentiment.toFixed(3)}</small>
                </div>
              </div>
            </div>

            {/* Detailed Analysis Sections */}
            <div className={styles.analysisSection}>
              <h3>📈 Communication Patterns</h3>

              <div className={styles.patternGrid}>
                <div className={styles.patternCard}>
                  <h4>🕐 Most Active Hour</h4>
                  <p className={styles.patternValue}>
                    {analysis.mostActiveHour}:00
                  </p>
                  <div className={styles.hourlyBreakdown}>
                    {Object.entries(analysis.messagesByHour)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .slice(0, 5)
                      .map(([hour, count]) => (
                        <div key={hour} className={styles.hourItem}>
                          <span>{hour}:00</span>
                          <span>{count} messages</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className={styles.patternCard}>
                  <h4>📅 Most Active Day</h4>
                  <p className={styles.patternValue}>
                    {analysis.mostActiveDay}
                  </p>
                  <div className={styles.weeklyBreakdown}>
                    {Object.entries(analysis.messagesByWeekday)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([day, count]) => (
                        <div key={day} className={styles.dayItem}>
                          <span>{day}</span>
                          <span>{count} messages</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Analysis */}
            <div className={styles.analysisSection}>
              <h3>👥 Contact Analysis</h3>

              <div className={styles.contactGrid}>
                {Object.entries(analysis.contactCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([contact, count]) => {
                    const sentiment =
                      analysis.averageSentimentByContact[contact] || 0;
                    const avgLength =
                      analysis.averageMessageLengthByContact[contact] || 0;
                    const responseTime =
                      analysis.averageResponseTimesByContact[contact];
                    const emojiCount = analysis.emojisByContact[contact] || 0;

                    return (
                      <div key={contact} className={styles.contactCard}>
                        <div className={styles.contactHeader}>
                          <h4>{contact}</h4>
                          <span className={styles.messageCount}>
                            {count} messages
                          </span>
                        </div>

                        <div className={styles.contactStats}>
                          <div className={styles.contactStat}>
                            <span className={styles.statLabel}>Sentiment:</span>
                            <span
                              className={styles.statValue}
                              style={{ color: getSentimentColor(sentiment) }}
                            >
                              {getSentimentLabel(sentiment)}
                            </span>
                          </div>

                          <div className={styles.contactStat}>
                            <span className={styles.statLabel}>
                              Avg Length:
                            </span>
                            <span className={styles.statValue}>
                              {Math.round(avgLength)} chars
                            </span>
                          </div>

                          {responseTime && (
                            <div className={styles.contactStat}>
                              <span className={styles.statLabel}>
                                Response Time:
                              </span>
                              <span className={styles.statValue}>
                                {responseTime < 60
                                  ? `${Math.round(responseTime)}m`
                                  : `${Math.round(responseTime / 60)}h`}
                              </span>
                            </div>
                          )}

                          <div className={styles.contactStat}>
                            <span className={styles.statLabel}>Emojis:</span>
                            <span className={styles.statValue}>
                              {emojiCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Emoji Analysis */}
            {analysis.totalEmojis > 0 && (
              <div className={styles.analysisSection}>
                <h3>😀 Emoji Analysis</h3>

                <div className={styles.emojiStats}>
                  <p>
                    Total emojis used:{" "}
                    <strong>{analysis.totalEmojis.toLocaleString()}</strong>
                  </p>

                  <div className={styles.topEmojis}>
                    <h4>Most Used Emojis</h4>
                    <div className={styles.emojiGrid}>
                      {analysis.topEmojis.slice(0, 10).map((emoji, index) => (
                        <div key={index} className={styles.emojiItem}>
                          <span className={styles.emojiChar}>
                            {emoji.emoji}
                          </span>
                          <span className={styles.emojiCount}>
                            {emoji.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Word Analysis */}
            <div className={styles.analysisSection}>
              <h3>📝 Word Analysis</h3>

              <div className={styles.wordCloud}>
                <h4>Most Frequently Used Words</h4>
                <div className={styles.wordGrid}>
                  {analysis.topWords.slice(0, 20).map((word, index) => {
                    const fontSize = Math.max(
                      12,
                      Math.min(
                        24,
                        12 + (word.count / analysis.topWords[0].count) * 12
                      )
                    );
                    return (
                      <span
                        key={index}
                        className={styles.wordItem}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {word.word} ({word.count})
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Export/Share Options */}
            <div className={styles.exportSection}>
              <h3>📤 Export & Share</h3>
              <p>Want to save or share your analysis? Here are some options:</p>

              <div className={styles.exportButtons}>
                <button
                  onClick={() => window.print()}
                  className={styles.exportBtn}
                >
                  🖨️ Print Report
                </button>

                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(analysis, null, 2);
                    const dataBlob = new Blob([dataStr], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "message-analysis.json";
                    link.click();
                  }}
                  className={styles.exportBtn}
                >
                  💾 Download JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
