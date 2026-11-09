import { supabase } from "./src/lib/supabase";
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bg: "#F6F7F1",
  card: "#FFFFFF",
  olive: "#59652F",
  olive2: "#778345",
  sage: "#DDE8C7",
  pale: "#EEF2E5",
  ink: "#28301D",
  muted: "#7B806F",
  line: "#E8EBDD",
  gold: "#D5AE56"
};

const cash = n =>
  Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const initial = {
  transactions: [
    {
      id: "1",
      title: "Mercado",
      category: "Alimentação",
      person: "Família",
      type: "expense",
      amount: 285.4,
      date: "Hoje"
    },
    {
      id: "2",
      title: "Salário",
      category: "Renda",
      person: "Responsável",
      type: "income",
      amount: 3200,
      date: "Hoje"
    },
    {
      id: "3",
      title: "Material escolar",
      category: "Educação",
      person: "Sofia",
      type: "expense",
      amount: 89.9,
      date: "Ontem"
    },
    {
      id: "4",
      title: "Lanche",
      category: "Alimentação",
      person: "Lucas",
      type: "expense",
      amount: 24,
      date: "Ontem"
    },
    {
      id: "5",
      title: "Transporte",
      category: "Transporte",
      person: "Família",
      type: "expense",
      amount: 120,
      date: "Segunda"
    }
  ],
  goals: [
    {
      id: "1",
      name: "Viagem em família",
      target: 3000,
      saved: 1250
    },
    {
      id: "2",
      name: "Reserva de emergência",
      target: 5000,
      saved: 2100
    }
  ],
  accessMode: "both",
  members: [
    {
      id: "lucas",
      name: "Lucas",
      role: "child",
      access: "managed",
      allowance: 200
    },
    {
      id: "sofia",
      name: "Sofia",
      role: "teen",
      access: "individual",
      allowance: 180
    }
  ]
};

const tabs = [
  ["home", "Início", "⌂"],
  ["transactions", "Movimentos", "↕"],
  ["family", "Família", "♧"],
  ["goals", "Metas", "◎"],
  ["learn", "Aprender", "▤"]
];

function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function Button({ title, onPress }) {
  return (
    <TouchableOpacity style={s.button} onPress={onPress}>
      <Text style={s.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function Heading({ title, action, onPress }) {
  return (
    <View style={s.heading}>
      <Text style={s.h2}>{title}</Text>
      {action && (
        <Text onPress={onPress} style={s.action}>
          {action}
        </Text>
      )}
    </View>
  );
}

function Transaction({ item }) {
  return (
    <Card style={s.tx}>
      <View style={s.txIcon}>
        <Text style={{ color: C.olive, fontSize: 18 }}>
          {item.type === "income" ? "↗" : "↘"}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={s.strong}>{item.title}</Text>
        <Text style={s.muted}>
          {item.category} · {item.person} · {item.date}
        </Text>
      </View>

      <Text
        style={[
          s.amount,
          { color: item.type === "income" ? C.olive2 : C.ink }
        ]}
      >
        {item.type === "income" ? "+" : "−"} {cash(item.amount)}
      </Text>
    </Card>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(false);
  const [period, setPeriod] = useState("Semana");
  const [filter, setFilter] = useState("Todos");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentação");
  const [person, setPerson] = useState("Família");
  const [type, setType] = useState("expense");

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [familyName, setFamilyName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [needsFamily, setNeedsFamily] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const [familyMember, setFamilyMember] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCheckReady, setFamilyCheckReady] = useState(false);
  const [familyCheckError, setFamilyCheckError] = useState("");
  const [familyCheckAttempt, setFamilyCheckAttempt] = useState(0);

  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionSaving, setTransactionSaving] = useState(false);

  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalContribution, setGoalContribution] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalSaving, setGoalSaving] = useState(false);

  // Carrega os dados locais do aplicativo.
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem("@financas_familia_v1");
        if (v) setData(JSON.parse(v));
      } catch (e) {
        console.log(e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem(
        "@financas_familia_v1",
        JSON.stringify(data)
      ).catch(console.log);
    }
  }, [data, ready]);

  // Recupera a sessão existente e acompanha login/logout.
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) setSession(session);
        if (mounted) setAuthReady(true);
      })
      .catch(error => {
        console.log("Erro ao recuperar sessão:", error.message);
        if (mounted) setAuthReady(true);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Recupera o vínculo do usuário com a família.
  useEffect(() => {
    if (!session?.user?.id) {
      setFamilyMember(null);
      setFamilyMembers([]);
      setNeedsFamily(false);
      setFamilyCheckReady(true);
      setFamilyCheckError("");
      return;
    }

    let active = true;

    setFamilyCheckReady(false);
    setFamilyCheckError("");

    (async () => {
      const { data: member, error } = await supabase
        .from("family_members")
        .select(
          "id, family_id, user_id, display_name, role, access_mode"
        )
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.log(
          "Erro ao consultar vínculo familiar:",
          error.message
        );
        setFamilyCheckError(error.message);
        setFamilyCheckReady(true);
        return;
      }

      if (!member) {
        setFamilyMember(null);
        setNeedsFamily(true);
        setFamilyCheckReady(true);
        return;
      }

      setFamilyMember(member);
      setNeedsFamily(false);

      setGuardianName(
        member.display_name ||
          session.user.user_metadata?.guardian_name ||
          "Responsável"
      );

      const {
        data: members,
        error: membersError
      } = await supabase
        .from("family_members")
        .select("id, family_id, display_name, role, access_mode")
        .eq("family_id", member.family_id)
        .order("display_name", { ascending: true });

      if (!active) return;

      if (membersError) {
        console.log(
          "Erro ao carregar membros:",
          membersError.message
        );
        setFamilyCheckError(membersError.message);
        setFamilyCheckReady(true);
        return;
      }

      setFamilyMembers(members || []);
      setPerson(member.display_name || "Família");
      setFamilyCheckReady(true);
    })();

    return () => {
      active = false;
    };
  }, [session?.user?.id, familyCheckAttempt]);

  // Carrega movimentações reais da família.
  useEffect(() => {
    if (
      !familyMember?.family_id ||
      !familyCheckReady ||
      familyCheckError
    ) {
      return;
    }

    let active = true;

    (async () => {
      setTransactionsLoading(true);
      setData(d => ({ ...d, transactions: [] }));

      const { data: rows, error } = await supabase
        .from("transactions")
        .select(
          "id, family_id, created_by, member_id, title, category, transaction_type, amount, occurred_at, created_at"
        )
        .eq("family_id", familyMember.family_id)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (!active) return;

      setTransactionsLoading(false);

      if (error) {
        Alert.alert(
          "Erro ao carregar movimentações",
          error.message
        );
        return;
      }

      setData(d => ({
        ...d,
        transactions: (rows || []).map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          person:
            familyMembers.find(m => m.id === row.member_id)
              ?.display_name || "Família",
          type: row.transaction_type,
          amount: Number(row.amount),
          date: row.occurred_at
            ? new Date(
                `${row.occurred_at}T12:00:00`
              ).toLocaleDateString("pt-BR")
            : "—"
        }))
      }));
    })();

    return () => {
      active = false;
    };
  }, [
    familyMember?.family_id,
    familyCheckReady,
    familyCheckError
  ]);

  // Carrega as metas financeiras reais da família no Supabase.
  useEffect(() => {
    if (
      !familyMember?.family_id ||
      !familyCheckReady ||
      familyCheckError
    ) {
      return;
    }

    let active = true;

    (async () => {
      setGoalsLoading(true);

      const { data: rows, error } = await supabase
        .from("savings_goals")
        .select(
          "id, family_id, title, target_amount, saved_amount, created_at"
        )
        .eq("family_id", familyMember.family_id)
        .order("created_at", { ascending: false });

      if (!active) return;

      setGoalsLoading(false);

      if (error) {
        Alert.alert("Erro ao carregar metas", error.message);
        return;
      }

      setGoals(rows || []);
    })();

    return () => {
      active = false;
    };
  }, [
    familyMember?.family_id,
    familyCheckReady,
    familyCheckError
  ]);

  // Cadastro de usuário.
  const handleSignUp = async () => {
    const email = authEmail.trim().toLowerCase();

    if (
      !authName.trim() ||
      !email ||
      authPassword.length < 8
    ) {
      return Alert.alert(
        "Confira os dados",
        "Informe seu nome, e-mail e uma senha com pelo menos 8 caracteres."
      );
    }

    setAuthBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: authPassword,
      options: {
        data: {
          guardian_name: authName.trim()
        }
      }
    });

    setAuthBusy(false);

    if (error) {
      return Alert.alert(
        "Não foi possível criar a conta",
        error.message
      );
    }

    setGuardianName(authName.trim());

    if (!data.session) {
      Alert.alert(
        "Confirme seu e-mail",
        "Enviamos um link de confirmação para seu endereço. Abra o link e depois volte ao aplicativo para entrar."
      );

      setAuthMode("login");
      setAuthPassword("");
    } else {
      Alert.alert(
        "Conta criada",
        "Sua conta foi criada. Agora vamos configurar sua família."
      );
    }
  };

  // Login.
  const handleLogin = async () => {
    const email = authEmail.trim().toLowerCase();

    if (!email || !authPassword) {
      return Alert.alert(
        "Preencha os campos",
        "Informe seu e-mail e sua senha."
      );
    }

    setAuthBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword
    });

    setAuthBusy(false);

    if (error) {
      return Alert.alert(
        "Não foi possível entrar",
        error.message
      );
    }
  };

  // Criação da família.
  const handleCreateFamily = async () => {
    if (!familyName.trim() || !guardianName.trim()) {
      return Alert.alert(
        "Preencha os campos",
        "Informe o nome da família e o nome do responsável."
      );
    }

    setAuthBusy(true);

    const { error } = await supabase.rpc(
      "create_family_with_guardian",
      {
        family_name: familyName.trim(),
        guardian_name: guardianName.trim()
      }
    );

    if (error) {
      setAuthBusy(false);
      return Alert.alert(
        "Não foi possível criar a família",
        error.message
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select(
        "id, family_id, user_id, display_name, role, access_mode"
      )
      .eq("user_id", session.user.id)
      .single();

    setAuthBusy(false);

    if (memberError) {
      return Alert.alert(
        "Família criada, mas não foi possível confirmar o vínculo",
        memberError.message
      );
    }

    setFamilyMember(member);
    setNeedsFamily(false);
    setFamilyCheckError("");
    setFamilyCheckReady(true);

    Alert.alert(
      "Família criada",
      "Sua família foi cadastrada com sucesso."
    );
  };

  // Logout.
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Erro ao sair", error.message);
    }
  };

  const income = useMemo(
    () =>
      data.transactions
        .filter(x => x.type === "income")
        .reduce((a, x) => a + Number(x.amount), 0),
    [data]
  );

  const expenses = useMemo(
    () =>
      data.transactions
        .filter(x => x.type === "expense")
        .reduce((a, x) => a + Number(x.amount), 0),
    [data]
  );

  // Salva uma movimentação no Supabase.
  const save = async () => {
    const n = Number(amount.replace(",", "."));

    if (!title.trim() || !Number.isFinite(n) || n <= 0) {
      return Alert.alert(
        "Confira os dados",
        "Informe uma descrição e um valor válido."
      );
    }

    if (!session?.user?.id || !familyMember?.family_id) {
      return Alert.alert(
        "Família não identificada",
        "Não foi possível identificar sua família. Saia e entre novamente."
      );
    }

    const selectedMember =
      person === "Família"
        ? null
        : familyMembers.find(
            m => m.display_name === person
          );

    if (person !== "Família" && !selectedMember) {
      return Alert.alert(
        "Membro não encontrado",
        "Atualize a lista de membros e tente novamente."
      );
    }

    setTransactionSaving(true);

    const payload = {
      family_id: familyMember.family_id,
      created_by: session.user.id,
      member_id: selectedMember?.id || null,
      title: title.trim(),
      category,
      transaction_type: type,
      amount: n,
      occurred_at: new Date().toISOString().slice(0, 10)
    };

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select(
        "id, title, category, transaction_type, amount, occurred_at, member_id"
      )
      .single();

    setTransactionSaving(false);

    if (error) {
      return Alert.alert(
        "Não foi possível salvar",
        error.message
      );
    }

    const savedMember = familyMembers.find(
      m => m.id === inserted.member_id
    );

    setData(d => ({
      ...d,
      transactions: [
        {
          id: inserted.id,
          title: inserted.title,
          category: inserted.category,
          person: savedMember?.display_name || "Família",
          type: inserted.transaction_type,
          amount: Number(inserted.amount),
          date: new Date(
            `${inserted.occurred_at}T12:00:00`
          ).toLocaleDateString("pt-BR")
        },
        ...d.transactions
      ]
    }));

    setTitle("");
    setAmount("");
    setModal(false);
  };

  // Cria uma meta financeira no Supabase.
  const handleSaveGoal = async () => {
    const cleanTitle = goalTitle.trim();
    const target = Number(goalTarget.replace(",", "."));

    if (
      !cleanTitle ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return Alert.alert(
        "Confira os dados",
        "Informe o nome da meta e um valor desejado maior que zero."
      );
    }

    if (familyMember?.role !== "guardian") {
      return Alert.alert(
        "Acesso restrito",
        "Somente o responsável pode cadastrar metas."
      );
    }

    setGoalSaving(true);

    const { data: inserted, error } = await supabase
      .from("savings_goals")
      .insert({
        family_id: familyMember.family_id,
        title: cleanTitle,
        target_amount: target,
        saved_amount: 0
      })
      .select(
        "id, family_id, title, target_amount, saved_amount, created_at"
      )
      .single();

    setGoalSaving(false);

    if (error) {
      return Alert.alert(
        "Não foi possível criar a meta",
        error.message
      );
    }

    setGoals(current => [inserted, ...current]);

    setGoalTitle("");
    setGoalTarget("");
    setGoalModal(false);

    Alert.alert(
      "Meta criada",
      "Sua meta foi salva no banco de dados."
    );
  };

  // Registra uma economia em uma meta.
  const handleAddContribution = async () => {
    const contribution = Number(
      goalContribution.replace(",", ".")
    );

    if (
      !selectedGoal ||
      !Number.isFinite(contribution) ||
      contribution <= 0
    ) {
      return Alert.alert(
        "Valor inválido",
        "Informe um valor de economia maior que zero."
      );
    }

    if (familyMember?.role !== "guardian") {
      return Alert.alert(
        "Acesso restrito",
        "Somente o responsável pode atualizar as economias."
      );
    }

    const newSavedAmount =
      Number(selectedGoal.saved_amount) + contribution;

    setGoalSaving(true);

    const { data: updated, error } = await supabase
      .from("savings_goals")
      .update({
        saved_amount: newSavedAmount
      })
      .eq("id", selectedGoal.id)
      .eq("family_id", familyMember.family_id)
      .select(
        "id, family_id, title, target_amount, saved_amount, created_at"
      )
      .single();

    setGoalSaving(false);

    if (error) {
      return Alert.alert(
        "Não foi possível atualizar a meta",
        error.message
      );
    }

    setGoals(current =>
      current.map(goal =>
        goal.id === updated.id ? updated : goal
      )
    );

    setGoalContribution("");
    setSelectedGoal(null);
    setGoalModal(false);

    Alert.alert(
      "Economia registrada",
      "O progresso da meta foi atualizado."
    );
  };

  // Cabeçalho.
  const Header = () => (
    <View style={s.header}>
      <View>
        <Text style={s.brand}>FINANÇAS EM FAMÍLIA</Text>
        <Text style={s.greeting}>Olá, família! 👋</Text>
        <Text style={s.authSwitch} onPress={handleLogout}>
          Sair da conta
        </Text>
      </View>

      <View style={s.avatar}>
        <Text style={s.avatarText}>F</Text>
      </View>
    </View>
  );

  // Tela inicial.
  const Home = () => (
    <View>
      <Card style={s.hero}>
        <Text style={s.heroLabel}>Saldo familiar</Text>
        <Text style={s.balance}>
          {cash(income - expenses)}
        </Text>

        <View style={s.metrics}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroLabel}>↗ Entradas</Text>
            <Text style={s.metricValue}>{cash(income)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.heroLabel}>↘ Saídas</Text>
            <Text style={s.metricValue}>{cash(expenses)}</Text>
          </View>
        </View>
      </Card>

      <Heading title="Resumo financeiro" />

      <Card>
        <View style={s.between}>
          <Text style={s.strong}>Gastos e economia</Text>

          <View style={s.row}>
            {["Semana", "Mês"].map(p => (
              <Text
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  s.period,
                  period === p && s.periodOn
                ]}
              >
                {p}
              </Text>
            ))}
          </View>
        </View>

        <View style={s.chart}>
          {(period === "Semana"
            ? [34, 62, 43, 78, 52, 35, 24]
            : [48, 72, 54, 86, 64, 42]
          ).map((v, i) => (
            <View key={i} style={s.barCol}>
              <View style={s.barBg}>
                <View
                  style={[
                    s.bar,
                    { height: `${v}%` }
                  ]}
                />
              </View>

              <Text style={s.muted}>
                {period === "Semana"
                  ? ["S", "T", "Q", "Q", "S", "S", "D"][i]
                  : ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"][i]}
              </Text>
            </View>
          ))}
        </View>

        <Text style={s.muted}>
          Gráfico ilustrativo — integração dos gráficos será feita em etapa posterior.
        </Text>
      </Card>

      <Heading
        title="Últimas movimentações"
        action="Ver todas"
        onPress={() => setTab("transactions")}
      />

      {data.transactions.slice(0, 3).map(x => (
        <Transaction key={x.id} item={x} />
      ))}

      <Button
        title="+ Adicionar movimentação"
        onPress={() => setModal(true)}
      />

      <Text style={s.note}>
        Movimentações exibidas são carregadas do banco de dados da família.
      </Text>
    </View>
  );

  // Tela de movimentações.
  const Transactions = () => (
    <View>
      <Heading
        title="Movimentações"
        action="+ Adicionar"
        onPress={() => setModal(true)}
      />

      {transactionsLoading && (
        <Text style={s.muted}>
          Carregando movimentações...
        </Text>
      )}

      <View style={s.row}>
        {["Todos", "income", "expense"].map((f, i) => (
          <Text
            key={f}
            onPress={() => setFilter(f)}
            style={[
              s.period,
              filter === f && s.periodOn
            ]}
          >
            {["Todos", "Entradas", "Saídas"][i]}
          </Text>
        ))}
      </View>

      {data.transactions
        .filter(x => filter === "Todos" || x.type === filter)
        .map(x => (
          <Transaction key={x.id} item={x} />
        ))}

      <Button
        title="Registrar movimentação"
        onPress={() => setModal(true)}
      />
    </View>
  );

  // Tela da família.
  const Family = () => (
    <View>
      <Heading title="Minha família" />

      <Text style={s.intro}>
        O responsável configura como cada filho participa. Os perfis individuais terão acesso limitado aos próprios registros.
      </Text>

      <Card>
        <Text style={s.strong}>
          Modelo de acesso da família
        </Text>

        <View style={s.row}>
          {[
            ["both", "Flexível"],
            ["managed", "Só responsáveis"],
            ["individual", "Contas individuais"]
          ].map(([v, l]) => (
            <Text
              key={v}
              onPress={() =>
                setData(d => ({
                  ...d,
                  accessMode: v
                }))
              }
              style={[
                s.chip,
                data.accessMode === v && s.chipOn
              ]}
            >
              {l}
            </Text>
          ))}
        </View>

        <Text style={s.muted}>
          A configuração é demonstrativa nesta versão local. A aplicação real será protegida pelo Supabase.
        </Text>
      </Card>

      {(data.members || []).map(kid => {
        const spent = data.transactions
          .filter(
            x =>
              x.person === kid.name &&
              x.type === "expense"
          )
          .reduce((a, x) => a + x.amount, 0);

        const limit = kid.allowance;

        return (
          <Card key={kid.id}>
            <View style={s.between}>
              <Text style={s.strong}>{kid.name}</Text>

              <Text style={s.tag}>
                {kid.role === "teen"
                  ? "Adolescente"
                  : "Criança"}
              </Text>
            </View>

            <View style={s.metrics}>
              <View style={{ flex: 1 }}>
                <Text style={s.muted}>
                  Mesada prevista
                </Text>
                <Text style={s.metricDark}>
                  {cash(limit)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.muted}>
                  Gastos registrados
                </Text>
                <Text style={s.metricDark}>
                  {cash(spent)}
                </Text>
              </View>
            </View>

            <View style={s.progressBg}>
              <View
                style={[
                  s.progress,
                  {
                    width: `${Math.min(
                      100,
                      spent / limit * 100
                    )}%`
                  }
                ]}
              />
            </View>

            <Text style={s.muted}>
              {Math.round(
                Math.min(100, spent / limit * 100)
              )}% da mesada utilizada
            </Text>

            <Text style={s.label}>
              Forma de acesso
            </Text>

            <View style={s.row}>
              <Text
                onPress={() =>
                  setData(d => ({
                    ...d,
                    members: d.members.map(m =>
                      m.id === kid.id
                        ? { ...m, access: "managed" }
                        : m
                    )
                  }))
                }
                style={[
                  s.chip,
                  kid.access === "managed" && s.chipOn
                ]}
              >
                Gerenciado pelo responsável
              </Text>

              <Text
                onPress={() =>
                  setData(d => ({
                    ...d,
                    members: d.members.map(m =>
                      m.id === kid.id
                        ? { ...m, access: "individual" }
                        : m
                    )
                  }))
                }
                style={[
                  s.chip,
                  kid.access === "individual" && s.chipOn
                ]}
              >
                Conta individual
              </Text>
            </View>
          </Card>
        );
      })}

      <Button
        title="+ Registrar gasto de um filho"
        onPress={() => {
          setPerson("Lucas");
          setType("expense");
          setModal(true);
        }}
      />

      <Text style={s.note}>
        A proposta é apoiar a educação e o diálogo familiar, não a vigilância. Dados demonstrativos não representam contas reais.
      </Text>
    </View>
  );

  // Tela de metas financeiras integrada ao Supabase.
  const Goals = () => (
    <View>
      <Heading
        title="Metas financeiras"
        action={
          familyMember?.role === "guardian"
            ? "+ Nova meta"
            : undefined
        }
        onPress={() => {
          setSelectedGoal(null);
          setGoalTitle("");
          setGoalTarget("");
          setGoalModal(true);
        }}
      />

      <Text style={s.intro}>
        Pequenos passos ajudam a alcançar grandes objetivos.
      </Text>

      {goalsLoading && (
        <Text style={s.muted}>
          Carregando metas...
        </Text>
      )}

      {!goalsLoading && goals.length === 0 && (
        <Card>
          <Text style={s.strong}>
            Nenhuma meta cadastrada
          </Text>

          <Text style={s.muted}>
            Crie uma meta para começar a acompanhar as economias da família.
          </Text>
        </Card>
      )}

      {goals.map(goal => {
        const target = Number(goal.target_amount);
        const saved = Number(goal.saved_amount);

        const progress =
          target > 0
            ? Math.min(100, (saved / target) * 100)
            : 0;

        return (
          <Card key={goal.id}>
            <Text style={s.strong}>
              {goal.title}
            </Text>

            <Text style={s.muted}>
              Objetivo: {cash(target)}
            </Text>

            <View style={s.between}>
              <Text style={s.goalValue}>
                {cash(saved)}
              </Text>

              <Text style={s.muted}>
                {Math.round(progress)}%
              </Text>
            </View>

            <View style={s.progressBg}>
              <View
                style={[
                  s.progress,
                  { width: `${progress}%` }
                ]}
              />
            </View>

            <Text style={s.muted}>
              Faltam {cash(Math.max(0, target - saved))}
            </Text>

            {familyMember?.role === "guardian" && (
              <Button
                title="+ Registrar economia"
                onPress={() => {
                  setSelectedGoal(goal);
                  setGoalContribution("");
                  setGoalModal(true);
                }}
              />
            )}
          </Card>
        );
      })}
    </View>
  );

  // Tela de educação financeira.
  const Learn = () => (
    <View>
      <Heading title="Aprender sobre dinheiro" />

      <Text style={s.intro}>
        Conhecimento para escolhas financeiras mais conscientes.
      </Text>

      {[
        [
          "Consumo consciente",
          "Diferencie necessidades e desejos antes de comprar."
        ],
        [
          "Como funciona o orçamento?",
          "Planeje entradas, despesas e uma reserva."
        ],
        [
          "Juros e parcelamentos",
          "Compare o preço à vista com o custo total."
        ],
        [
          "Economizar em família",
          "Transforme objetivos em hábitos compartilhados."
        ]
      ].map(([a, b]) => (
        <Card key={a}>
          <Text style={s.strong}>{a}</Text>
          <Text style={s.muted}>{b}</Text>
        </Card>
      ))}

      <Card style={{ backgroundColor: C.pale }}>
        <Text style={s.strong}>
          Desafio da semana
        </Text>

        <Text style={s.body}>
          Escolham uma despesa que pode ser reduzida e acompanhem quanto conseguiram economizar.
        </Text>
      </Card>
    </View>
  );

  // Telas de autenticação e configuração inicial.
  if (!authReady) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={C.bg}
        />

        <View style={s.authWrap}>
          <Text style={s.brand}>
            FINANÇAS EM FAMÍLIA
          </Text>

          <Text style={s.h2}>
            Carregando sua conta...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={C.bg}
        />

        <KeyboardAvoidingView
          style={s.authWrap}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center"
            }}
          >
            <Text style={s.brand}>
              FINANÇAS EM FAMÍLIA
            </Text>

            <Text style={s.authTitle}>
              {authMode === "login"
                ? "Bem-vindo de volta"
                : "Crie sua conta"}
            </Text>

            <Text style={s.intro}>
              {authMode === "login"
                ? "Entre para acessar o espaço financeiro da sua família."
                : "Cadastre-se como responsável para começar."}
            </Text>

            {authMode === "signup" && (
              <>
                <Text style={s.label}>
                  Nome do responsável
                </Text>

                <TextInput
                  value={authName}
                  onChangeText={setAuthName}
                  placeholder="Seu nome"
                  style={s.input}
                />
              </>
            )}

            <Text style={s.label}>E-mail</Text>

            <TextInput
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="seu@email.com"
              style={s.input}
            />

            <Text style={s.label}>Senha</Text>

            <TextInput
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              placeholder="Mínimo de 8 caracteres"
              style={s.input}
            />

            <Button
              title={
                authBusy
                  ? "Aguarde..."
                  : authMode === "login"
                    ? "Entrar"
                    : "Criar conta"
              }
              onPress={
                authMode === "login"
                  ? handleLogin
                  : handleSignUp
              }
            />

            <Text
              style={s.authSwitch}
              onPress={() =>
                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                )
              }
            >
              {authMode === "login"
                ? "Ainda não tem conta? Criar cadastro"
                : "Já tem uma conta? Fazer login"}
            </Text>

            <Text style={s.note}>
              Ao criar uma conta, você receberá um e-mail para confirmar seu endereço antes do primeiro acesso.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (session && !familyCheckReady) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={C.bg}
        />

        <View style={s.authWrap}>
          <Text style={s.brand}>
            FINANÇAS EM FAMÍLIA
          </Text>

          <Text style={s.h2}>
            Verificando sua família...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session && familyCheckError) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={C.bg}
        />

        <View style={s.authWrap}>
          <Text style={s.brand}>
            FINANÇAS EM FAMÍLIA
          </Text>

          <Text style={s.authTitle}>
            Não foi possível validar seu acesso
          </Text>

          <Text style={s.intro}>
            {familyCheckError}
          </Text>

          <Button
            title="Tentar novamente"
            onPress={() => {
              setFamilyCheckError("");
              setFamilyCheckReady(false);
              setFamilyMember(null);
              setFamilyCheckAttempt(v => v + 1);
            }}
          />

          <Text
            style={s.authSwitch}
            onPress={handleLogout}
          >
            Sair da conta
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (needsFamily) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={C.bg}
        />

        <KeyboardAvoidingView
          style={s.authWrap}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center"
            }}
          >
            <Text style={s.brand}>
              FINANÇAS EM FAMÍLIA
            </Text>

            <Text style={s.authTitle}>
              Configure sua família
            </Text>

            <Text style={s.intro}>
              Sua conta está conectada. Agora informe os dados para criar o espaço familiar.
            </Text>

            <Text style={s.label}>
              Nome do responsável
            </Text>

            <TextInput
              value={guardianName}
              onChangeText={setGuardianName}
              placeholder="Seu nome"
              style={s.input}
            />

            <Text style={s.label}>
              Nome da família
            </Text>

            <TextInput
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="Ex.: Família Silva"
              style={s.input}
            />

            <Button
              title={
                authBusy
                  ? "Criando..."
                  : "Criar minha família"
              }
              onPress={handleCreateFamily}
            />

            <Text
              style={s.authSwitch}
              onPress={handleLogout}
            >
              Sair da conta
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const screens = {
    home: <Home />,
    transactions: <Transactions />,
    family: <Family />,
    goals: <Goals />,
    learn: <Learn />
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.bg}
      />

      <Header />

      <ScrollView contentContainerStyle={s.content}>
        {screens[tab]}
      </ScrollView>

      <View style={s.nav}>
        {tabs.map(([id, label, ico]) => (
          <TouchableOpacity
            key={id}
            onPress={() => setTab(id)}
            style={s.navItem}
          >
            <Text
              style={[
                s.navIcon,
                tab === id && { color: C.olive }
              ]}
            >
              {ico}
            </Text>

            <Text
              style={[
                s.navLabel,
                tab === id && {
                  color: C.olive,
                  fontWeight: "800"
                }
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal de movimentações */}
      <Modal
        visible={modal}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(false)}
      >
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setModal(false)}
          />

          <ScrollView style={s.sheet}>
            <View style={s.between}>
              <Text style={s.h2}>
                Nova movimentação
              </Text>

              <Text
                onPress={() => setModal(false)}
                style={s.action}
              >
                Fechar
              </Text>
            </View>

            <Text style={s.label}>Tipo</Text>

            <View style={s.row}>
              {[
                ["expense", "Despesa"],
                ["income", "Receita"]
              ].map(([v, l]) => (
                <Text
                  key={v}
                  onPress={() => setType(v)}
                  style={[
                    s.period,
                    type === v && s.periodOn
                  ]}
                >
                  {l}
                </Text>
              ))}
            </View>

            <Text style={s.label}>Descrição</Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex.: Compra no mercado"
              style={s.input}
            />

            <Text style={s.label}>Valor (R$)</Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
              style={s.input}
            />

            <Text style={s.label}>Categoria</Text>

            <View style={s.row}>
              {[
                "Alimentação",
                "Educação",
                "Transporte",
                "Lazer",
                "Moradia",
                "Renda"
              ].map(c => (
                <Text
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    s.chip,
                    category === c && s.chipOn
                  ]}
                >
                  {c}
                </Text>
              ))}
            </View>

            <Text style={s.label}>Responsável</Text>

            <View style={s.row}>
              {[
                "Família",
                ...familyMembers.map(m => m.display_name)
              ].map(p => (
                <Text
                  key={p}
                  onPress={() => setPerson(p)}
                  style={[
                    s.chip,
                    person === p && s.chipOn
                  ]}
                >
                  {p}
                </Text>
              ))}
            </View>

            <Button
              title={
                transactionSaving
                  ? "Salvando..."
                  : "Salvar movimentação"
              }
              onPress={save}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de metas financeiras */}
      <Modal
        visible={goalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModal(false)}
      >
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setGoalModal(false)}
          />

          <ScrollView
            style={s.sheet}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.between}>
              <Text style={s.h2}>
                {selectedGoal
                  ? "Registrar economia"
                  : "Nova meta"}
              </Text>

              <Text
                onPress={() => setGoalModal(false)}
                style={s.action}
              >
                Fechar
              </Text>
            </View>

            {selectedGoal ? (
              <>
                <Text style={s.label}>
                  {selectedGoal.title}
                </Text>

                <Text style={s.muted}>
                  Valor já economizado:{" "}
                  {cash(selectedGoal.saved_amount)}
                </Text>

                <Text style={s.label}>
                  Quanto foi economizado? (R$)
                </Text>

                <TextInput
                  value={goalContribution}
                  onChangeText={setGoalContribution}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  style={s.input}
                />

                <Button
                  title={
                    goalSaving
                      ? "Salvando..."
                      : "Registrar economia"
                  }
                  onPress={handleAddContribution}
                />
              </>
            ) : (
              <>
                <Text style={s.label}>
                  Nome da meta
                </Text>

                <TextInput
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder="Ex.: Viagem em família"
                  style={s.input}
                />

                <Text style={s.label}>
                  Valor desejado (R$)
                </Text>

                <TextInput
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                  keyboardType="decimal-pad"
                  placeholder="Ex.: 3000,00"
                  style={s.input}
                />

                <Button
                  title={
                    goalSaving
                      ? "Criando..."
                      : "Criar meta"
                  }
                  onPress={handleSaveGoal}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg
  },
  authWrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center"
  },
  authTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: C.ink,
    marginTop: 14,
    marginBottom: 8
  },
  authSwitch: {
    color: C.olive2,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16
  },
  header: {
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  brand: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.olive2,
    fontWeight: "900"
  },
  greeting: {
    fontSize: 23,
    fontWeight: "900",
    color: C.ink,
    marginTop: 4
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.sage,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontWeight: "900",
    fontSize: 17,
    color: C.olive
  },
  content: {
    paddingHorizontal: 17,
    paddingBottom: 25
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 19,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: C.line
  },
  hero: {
    backgroundColor: C.olive,
    padding: 21,
    marginTop: 5
  },
  heroLabel: {
    color: "#E5EACF",
    fontSize: 12
  },
  balance: {
    fontSize: 31,
    fontWeight: "900",
    color: "#FFF",
    marginTop: 8,
    marginBottom: 15
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFF",
    marginTop: 4
  },
  metricDark: {
    fontSize: 15,
    fontWeight: "900",
    color: C.ink,
    marginTop: 4
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 19,
    marginBottom: 10
  },
  h2: {
    fontSize: 18,
    fontWeight: "900",
    color: C.ink
  },
  action: {
    fontSize: 13,
    color: C.olive2,
    fontWeight: "800"
  },
  strong: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink
  },
  body: {
    fontSize: 13,
    color: C.ink,
    lineHeight: 20
  },
  muted: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4
  },
  intro: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    marginBottom: 12
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    alignItems: "center"
  },
  period: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.pale,
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden"
  },
  periodOn: {
    backgroundColor: C.olive,
    color: "#FFF"
  },
  chart: {
    height: 145,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 18
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 7
  },
  barBg: {
    height: 105,
    width: 18,
    backgroundColor: C.pale,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  bar: {
    width: "100%",
    backgroundColor: C.olive2,
    borderRadius: 10
  },
  tx: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  amount: {
    fontSize: 12,
    fontWeight: "900"
  },
  button: {
    backgroundColor: C.olive,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 9,
    marginBottom: 12
  },
  buttonText: {
    fontSize: 13,
    color: "#FFF",
    fontWeight: "900"
  },
  note: {
    fontSize: 10,
    color: C.muted,
    textAlign: "center",
    lineHeight: 16,
    marginVertical: 9
  },
  tag: {
    fontSize: 10,
    color: C.olive,
    backgroundColor: C.pale,
    padding: 6,
    borderRadius: 10
  },
  progressBg: {
    height: 8,
    backgroundColor: C.pale,
    borderRadius: 9,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 7
  },
  progress: {
    height: 8,
    backgroundColor: C.olive2,
    borderRadius: 9
  },
  goalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: C.olive,
    marginTop: 12
  },
  nav: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 17 : 9,
    justifyContent: "space-around"
  },
  navItem: {
    flex: 1,
    alignItems: "center"
  },
  navIcon: {
    fontSize: 21,
    color: C.muted
  },
  navLabel: {
    fontSize: 9,
    color: C.muted,
    marginTop: 3
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,25,12,.38)",
    justifyContent: "flex-end"
  },
  sheet: {
    maxHeight: "86%",
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: C.ink,
    marginTop: 13,
    marginBottom: 7
  },
  input: {
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    color: C.ink
  },
  chip: {
    backgroundColor: C.pale,
    color: C.muted,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    fontSize: 11,
    overflow: "hidden"
  },
  chipOn: {
    backgroundColor: C.olive,
    color: "#FFF"
  }
});