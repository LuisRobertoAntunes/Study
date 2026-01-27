# Study

[![GitHub license](https://img.shields.io/github/license/LuisRobertoAntunes/Study.svg)](https://github.com/LuisRobertoAntunes/Study/blob/master/LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/version/LuisRobertoAntunes/Study)](https://github.com/LuisRobertoAntunes/Study/blob/master/package.json)

O **Study** é uma aplicação completa para planejamento de estudos, projetada para ajudar estudantes a organizar seus horários, acompanhar o progresso e gerenciar revisões de forma eficaz.

> [!IMPORTANT]
> Este projeto é um **fork** do projeto original [Ouroboros](https://github.com/grebsu/Ouroboros), desenvolvido por [Grebsu](https://github.com/grebsu). O **Study** mantém a essência do projeto original sob a licença MIT, incorporando modificações, melhorias de interface e novas funcionalidades desenvolvidas por [Luis Roberto](https://github.com/LuisRobertoAntunes).

## 📖 Sumário
- [✨ Funcionalidades](#-funcionalidades)
- [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [🏁 Como Começar](#-como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Executando a Aplicação](#executando-a-aplicação)
    - [Modo de Desenvolvimento](#modo-de-desenvolvimento)
    - [Modo de Produção com Docker](#modo-de-produção-com-docker)
    - [Construindo e Executando a Versão Desktop (Electron)](#construindo-e-executando-a-versão-desktop-electron)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

## ✨ Funcionalidades

- **Planejamento de Estudos por Ciclos:** Crie e gerencie ciclos de estudo com base em editais ou objetivos específicos.
- **Registro de Sessões:** Registre sessões de estudo para diferentes matérias, monitorando o tempo e o conteúdo estudado.
- **Estatísticas de Desempenho:** Visualize sua distribuição de estudos e desempenho com gráficos dinâmicos (progresso semanal, horas por matéria, etc.).
- **Gerenciamento de Revisões:** Agende e acompanhe revisões para garantir a retenção do conteúdo a longo prazo.
- **Acompanhamento de Simulados:** Registre os resultados dos simulados para monitorar sua evolução.
- **Cronômetro Integrado:** Utilize um cronômetro para marcar o tempo de estudo com precisão.
- **Matérias e Tópicos Personalizáveis:** Adicione suas próprias matérias e tópicos para adaptar o planejador às suas necessidades.
- **Modo Claro e Escuro:** Alterne entre temas para uma visualização mais confortável.
- **Interface com Drag-and-Drop:** Reordene e gerencie facilmente seus itens de estudo.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI:** [Radix UI](https://www.radix-ui.com/) & [Ícones Lucide](https://lucide.dev/)
- **Visualização de Dados:** [Chart.js](https://www.chartjs.org/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)
- **Gerenciamento de Datas:** [date-fns](https://date-fns.org/)
- **Containerização:** [Docker](https://www.docker.com/)

## 🏁 Como Começar

Siga estas instruções para obter uma cópia do projeto e executá-lo em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior recomendada)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/LuisRobertoAntunes/Study.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd Study
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

### Executando a Aplicação

#### Modo de Desenvolvimento

Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

#### Modo de Produção com Docker

Para executar a aplicação em um contêiner Docker, garantindo um ambiente de produção consistente:

1.  **Construa a imagem Docker:**
    ```bash
    docker compose build
    ```

2.  **Inicie a aplicação:**
    ```bash
    docker compose up -d
    ```
    A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

#### Construindo e Executando a Versão Desktop (Electron)

Para construir e executar a aplicação como um aplicativo de desktop (Linux, Windows) usando Electron, siga os passos abaixo. Certifique-se de que todas as dependências gerais do projeto já foram instaladas com `npm install`.

1.  **Configuração Inicial:**
    Este comando prepara o ambiente e pode ser necessário para garantir que tudo funcione corretamente.
    ```bash
    npm run setup
    ```

2.  **Executar em Modo de Desenvolvimento:**
    Para iniciar o aplicativo Electron em modo de desenvolvimento com hot-reload.
    ```bash
    npm run dev:electron
    ```

3.  **Construir para Produção:**
    Para gerar os pacotes de instalação para produção (ex: `.deb`, `.AppImage` para Linux; `.exe` para Windows).
    ```bash
    npm run build:electron
    ```
    Os arquivos finais serão gerados na pasta `dist/`.
## 🤝 Contribuição

Contribuições são muito bem-vindas! Se você tiver ideias, sugestões ou quiser reportar um bug, por favor, abra uma issue ou envie um pull request.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.


