import { Component } from 'react';
import ErrorState from './ui/ErrorState';

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route crashed:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <ErrorState error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
