import React, { useCallback, useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Button } from "react-native";
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from "@react-native-voice/voice";
const SpeechText: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize Voice module
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Handler for speech results
  const onSpeechResults = (event: SpeechResultsEvent) => {
    setResults(event.value ?? []);
  };

  // Handler for speech errors
  const onSpeechError = (event: SpeechErrorEvent) => {
    setError(event.error.message);
  };

  // Start listening
  const startListening = useCallback(() => {
    setError(null);
    setResults([]);
    setIsListening(true);
    Voice.start("en-US")
      .then(() => console.log("Started listening"))
      .catch((err) => {
        setIsListening(false);
        setError(err.message);
      });
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    Voice.stop()
      .then(() => setIsListening(false))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 30,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Voice Recognizer</Text>
      <Button
        title={isListening ? "Stop Listening" : "Start Listening"}
        onPress={isListening ? stopListening : startListening}
      />
      {/* {error && (
        <Text style={{color: 'red', marginTop: 20}}>{`Error: ${error}`}</Text>
      )} */}
      <View style={{ marginTop: 20 }}>
        <Text> {results[0]}</Text>
        {/* {results.map((result, index) => (
          <Text key={index} style={{fontSize: 18}}>
            {result}
          </Text>
        ))} */}
      </View>
    </View>
  );
};

export default SpeechText;
