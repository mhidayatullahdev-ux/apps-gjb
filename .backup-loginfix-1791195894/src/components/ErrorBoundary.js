import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch (e) {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errMsg = String(
        (this.state.error && this.state.error.message)
          ? this.state.error.message
          : this.state.error
      );

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.iconChar}>!</Text>
            <Text style={styles.title}>Ups, ada yang salah</Text>
            <Text style={styles.message}>
              Aplikasi mengalami kendala. Silakan coba lagi atau restart aplikasi.
            </Text>

            {__DEV__ && this.state.error ? (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Debug (dev only):</Text>
                <Text style={styles.debugText}>{errMsg}</Text>
              </View>
            ) : null}

            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Coba Lagi</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0C10' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconChar: {
    color: '#D51C29',
    fontSize: 64,
    fontWeight: '900',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#A3A8B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  debugBox: {
    backgroundColor: '#141620',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D51C29',
    width: '100%',
  },
  debugTitle: {
    color: '#F2B705',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  debugText: {
    color: '#A3A8B8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#D51C29',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
