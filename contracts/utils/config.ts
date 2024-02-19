class Config {
  private static _config: Config | null;

  readonly networks: Networks | null;
  readonly deployment: Deployment | null;
  readonly fluenceMultisig: string | null = null;

  constructor(
    _networks: Networks,
    _deployment: Deployment,
    _fluenceMultisig: string
  ) {
    this.deployment = _deployment;
    this.networks = _networks;
    this.fluenceMultisig = _fluenceMultisig;
  }

  public static get(
    _networks: Networks | null = null,
    _deployment: Deployment | null = null,
    _fluenceMultisig: string | null = null
  ): Config {
    if (this._config === null || this._config == undefined) {
      this._config = new Config(_networks!, _deployment!, _fluenceMultisig!);
    }
    return this._config;
  }

  public static reset(
    _networks: Networks | null = null,
    _deployment: Deployment | null = null,
    _fluenceMultisig: string | null = null
  ) {
    this._config = new Config(_networks!, _deployment!, _fluenceMultisig!);
  }

  public static isInited(): boolean {
    return this._config !== null;
  }
}

enum NetworkTypes {
  Mainnet = "mainnet",
  Testnet = "testnet",
}

type Networks = {
  etherscanApiKey: string;
  repotGas: boolean;
  mainnet: NetworkConfig | null;
  testnet: NetworkConfig | null;
};

type NetworkConfig = {
  url: string;
  privateKey: string;
};

type Contracts = {
  usdToken?: string;
  balancerHelper?: string;
  balancerLBPFactory?: string;
  uniswapFactory?: string;
  uniswapNFTManager?: string;
  balancerVault?: string;
};

type Deployment = {
  contracts?: Contracts;
  pool?: Pools;
  token?: Token;
  executor?: Executor;
  devRewardDistributor?: DevRewardDistributor;
  investorsVesting?: Vesting;
  teamVesting?: Vesting;
  fluenceVesting?: FluenceVesting;
  governor?: Governor;
};

type Pools = {
  lbpPoolDurationDays: number;
  swapFeePercentage: number;
  flt: TokenPoolConfig;
  usd: TokenPoolConfig;
};

type TokenPoolConfig = {
  weight: number;
  endWeight: number;
  initialAmount: number;
};

type Token = {
  totalSupply: number;
};

type Executor = {
  delayDays: number;
};

type DevRewardDistributor = {
  merkleRoot: string;
  initialReward: number;
  totalRewards: number;
  halvePeriodMonths: number;
  lockupPeriod: number;
  claimingPeriodMonths: number;
};

type Vesting = {
  csvFile?: string;
  delayDurationMonths: number;
  vestingDurationMonths: number;
  accounts: Array<string>;
  amounts: Array<number>;
};

type FluenceVesting = {
  delayDurationMonths: number;
  vestingDurationMonths: number;
  account: string;
  amount: number;
};

type Governor = {
  quorum: number;
  votingDelayDays: number;
  votingPeriodDays: number;
  proposalThreshold: number;
};

export {
  Networks,
  NetworkConfig,
  Deployment,
  Token,
  Executor,
  DevRewardDistributor,
  Vesting,
  FluenceVesting,
  Governor,
  Config,
};
