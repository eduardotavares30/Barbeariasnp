# Barbearia RA Torre 2

Projeto unificado do site público de agendamento e do painel administrativo. O resultado final está na raiz desta pasta; as duas pastas recebidas continuam preservadas e a cópia integral anterior às alterações está em `_backup-original-2026-10-29/`.

## Estrutura final

- `index.html`: site público e fluxo de agendamento.
- `admin.html`: painel protegido por Firebase Authentication e perfil administrativo.
- `css/`: estilos separados do site e do painel.
- `js/site.js`: navegação, profissionais, serviços, disponibilidade e reserva.
- `js/admin/`: agenda, relatórios, clientes/RA Club, PDV, contas a pagar e configurações.
- `js/firebase-config.js`: configuração pública do projeto Firebase `barbearia50k`.
- `firebase/`: regras de Firestore e Storage.
- `scripts/`: servidor local e utilitários administrativos seguros.
- `assets/`: logo e imagens originais.

## Executar localmente

Requer Node.js 20 ou superior.

```powershell
npm install
npm start
```

Abra:

- Site: `http://127.0.0.1:4173`
- Painel: `http://127.0.0.1:4173/admin.html`

O servidor local não realiza publicação nem deploy. Para uma conferência rápida dos caminhos e arquivos:

```powershell
npm run check
```

## Configurar o Firebase

O front-end já aponta para o projeto Firebase encontrado no site original (`barbearia50k`). Se outro projeto for usado, atualize somente `js/firebase-config.js` e `.firebaserc`.

No Firebase Console:

1. Ative **Authentication > Sign-in method > Email/Password**.
2. Crie o Firestore em modo de produção.
3. Ative o Storage se for usar fotos de profissionais.
4. Aplique `firebase/firestore.rules` e `firebase/storage.rules` antes de usar dados reais.
5. Adicione `127.0.0.1` e `localhost` aos domínios autorizados do Authentication, se ainda não estiverem listados.

Com a Firebase CLI autenticada, as regras podem ser aplicadas futuramente com:

```powershell
npx firebase-tools deploy --only firestore:rules,storage
```

Esse comando altera apenas as regras do projeto Firebase; não publica o site.

### Conta de serviço para scripts locais

Os scripts administrativos usam uma chave de conta de serviço mantida **fora** deste projeto. Baixe-a em Firebase Console > Configurações do projeto > Contas de serviço e, na sessão atual do PowerShell, informe:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\seguro\service-account.json"
$env:FIREBASE_PROJECT_ID="barbearia50k"
```

O `.gitignore` bloqueia nomes comuns de chaves, mas a chave não deve ser copiada para esta pasta.

## Criar ou confirmar o administrador

O administrador principal permitido é `eduardolacerda0908@gmail.com`. Para criar ou atualizar a conta sem gravar a senha em HTML, JavaScript, documentação ou Git:

```powershell
npm run setup:admin
```

O script solicita a senha sem exibi-la, cria/atualiza o usuário no Authentication, aplica a permissão administrativa e cria `admins/{uid}`. Como alternativa, crie o usuário manualmente no Authentication; ao fazer o primeiro login com o e-mail principal, o painel tenta registrar o perfil `admins/{uid}`.

Outros usuários autenticados continuam bloqueados até terem um documento `admins/{uid}` com `tipo: "admin"` e `status: "ativo"`.

## Dados iniciais e serviços

Para cadastrar somente os dados que já existiam no projeto (sem duplicar coleções preenchidas):

```powershell
npm run seed
```

O script inclui os três serviços originais, o profissional Rodrigo, o WhatsApp existente e o horário de segunda a sábado. Depois, use **Painel > Configurações** para:

- cadastrar, editar, ordenar, ativar ou desativar serviços;
- cadastrar profissionais e fotos;
- definir horários semanais, pausas, folgas e exceções.

Se já existem agendamentos nas coleções antigas `reservas_*`, sincronize a nova lista pública de disponibilidade:

```powershell
npm run migrate:availability
```

Essa lista contém apenas data, hora, profissional e duração; nomes e telefones ficam privados para administradores.

## Testar o fluxo

1. Inicie com `npm start` e abra o site.
2. Escolha um profissional, informe nome, sobrenome e telefone com DDD.
3. Escolha a situação do RA Club, serviço, data futura e horário.
4. Confirme. O botão fica bloqueado durante o envio e a transação reserva todos os blocos da duração do serviço.
5. Use o botão da confirmação para enviar o resumo ao WhatsApp.
6. Entre no painel e confirme que o agendamento aparece na agenda.
7. Edite cliente, serviço, profissional, pagamento ou status; teste também bloqueio, desbloqueio e cancelamento.
8. Em uma janela anônima, confirme que `admin.html` permanece na tela de login e rejeita contas sem perfil administrativo.

Cenários importantes: formulário vazio, telefone inválido, data passada, dia fechado, horário ocupado, dois envios no mesmo horário, clique repetido e falha de rede. O reagendamento público abre o WhatsApp; a alteração no banco é feita pelo administrador para evitar que dados de outros clientes sejam expostos.

## Segurança

- O painel exige autenticação e perfil administrativo ativo.
- Agendamentos e dados financeiros não têm leitura pública.
- O site público lê apenas configurações, serviços, profissionais e blocos de disponibilidade sem dados pessoais.
- A criação pública valida campos, formatos e a ocupação do horário.
- Senhas, contas de serviço e chaves privadas não ficam no front-end.

Para produção com grande volume ou risco de abuso, recomenda-se adicionar Firebase App Check e mover a criação da reserva para uma Cloud Function/servidor confiável. As chaves presentes em `firebase-config.js` são identificadores públicos normais de aplicações Firebase Web; a proteção real está nas regras.

## Publicar futuramente no Vercel

Nenhum deploy foi executado. O projeto está preparado como site estático por `vercel.json`, com URLs limpas e cabeçalhos de segurança. O `.vercelignore` impede o envio das cópias de segurança, versões antigas, scripts administrativos, regras Firebase, arquivos locais e possíveis credenciais.

Ao importar pelo painel do Vercel, use:

- **Framework Preset:** Other
- **Root Directory:** raiz desta pasta
- **Build Command:** vazio
- **Output Directory:** vazio
- **Environment Variables:** nenhuma é obrigatória para o front-end

Também é possível criar primeiro um preview pela CLI:

```powershell
vercel
```

Teste o endereço de preview e somente depois publique em produção:

```powershell
vercel --prod
```

Depois que o Vercel informar o domínio, adicione tanto `nome-do-projeto.vercel.app` quanto qualquer domínio personalizado em **Firebase Console > Authentication > Settings > Authorized domains**. As regras do Firestore e Storage continuam sendo aplicadas pelo Firebase, não pelo Vercel.

Antes de liberar o endereço ao público, teste `/`, `/admin`, login, logout, criação de agendamento, conflito de horário e visualização no painel.

## Pendências que exigem acesso do proprietário

- Aplicar as regras no projeto Firebase real.
- Confirmar/criar o usuário administrador e a senha diretamente no Firebase.
- Executar a migração de disponibilidade se o banco atual já possuir reservas.
- Confirmar fotos, descrições, preços, durações, folgas e horários vigentes no painel.
- Confirmar se o link atual do RA Club continua válido.
