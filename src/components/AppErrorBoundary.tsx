import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Erro inesperado na aplicação."
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Menufy render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="system-error-page">
          <div className="system-error-card">
            <span className="eyebrow">Menufy</span>
            <h1>Não foi possível abrir esta página</h1>
            <p>
              A aplicação encontrou um erro ao carregar. Atualize a página ou volte ao início.
            </p>

            {this.state.message && (
              <code className="system-error-code">{this.state.message}</code>
            )}

            <div className="system-error-actions">
              <button className="button" onClick={() => window.location.reload()}>
                Tentar novamente
              </button>
              <a className="button button-outline" href="/">
                Voltar ao início
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
