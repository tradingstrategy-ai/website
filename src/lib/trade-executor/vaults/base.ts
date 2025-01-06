import type { SmartContracts } from '../schemas/summary';
import type { Chain } from '$lib/helpers/chain';

export const DepositMethod = {
	INTERNAL: 'internal',
	EXTERNAL: 'external'
} as const;

/**
 * BaseAssetManager functionality is shared across non-vault asset managers
 * (i.e., HotWallet) and vault adapters.
 */
export abstract class BaseAssetManager {
	abstract readonly type: string;
	abstract readonly label: string;
	abstract readonly logoUrl: string;

	constructor(public readonly chain: Chain) {}

	// overridden in BaseVault to append " vault"
	get mode(): string {
		return this.label;
	}

	// override this is subclass if short label should be something different (shorter)
	get shortLabel(): string {
		return this.label;
	}

	depositEnabled(): this is BaseVault<SmartContracts> {
		return this instanceof BaseVault;
	}
}

/**
 * BaseVault provides functionality and interfaces used by all vault adapters
 * (e.g., EnzymeVault or VelvetVault)
 */
export abstract class BaseVault<Contracts extends SmartContracts> extends BaseAssetManager {
	abstract readonly depositMethod: (typeof DepositMethod)[keyof typeof DepositMethod];

	constructor(
		chain: Chain,
		protected readonly contracts: Contracts
	) {
		super(chain);
	}

	get mode(): string {
		return `${this.label} vault`;
	}

	abstract get externalProviderUrl(): string;
}
