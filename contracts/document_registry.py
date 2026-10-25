import smartpy as sp

# ==============================================================================
# SMART CONTRACT SPECIFICATION
# Write entrypoint: register
#   Parameters: record_id (string), label (string), sha256 (string)
# Read-only on-chain view: get_record(record_id)
#   Returns: sp.option[record_type] (label, sha256, registrar, registered_at)
# Restriction: Registration is restricted to self.data.admin
# ==============================================================================

@sp.module
def main():
    record_type: type = sp.record(
        label=sp.string,
        sha256=sp.string,
        registrar=sp.address,
        registered_at=sp.timestamp,
    )

    register_params_type: type = sp.record(
        record_id=sp.string,
        label=sp.string,
        sha256=sp.string,
    )

    class DocumentRegistry(sp.Contract):
        def __init__(self, admin: sp.address):
            self.data.admin = admin
            self.data.records = sp.cast(sp.big_map(), sp.big_map[sp.string, record_type])

        @sp.entrypoint
        def register(self, params: register_params_type):
            # Explicitly type and check parameters
            sp.cast(params, register_params_type)

            # Restrict registration to the configured administrator
            assert sp.sender == self.data.admin, "UNAUTHORIZED: Sender is not admin"

            # Prevent duplicate record IDs
            assert not (params.record_id in self.data.records), "RECORD_EXISTS: Record ID already registered"

            # Store document record
            self.data.records[params.record_id] = sp.record(
                label=params.label,
                sha256=params.sha256,
                registrar=sp.sender,
                registered_at=sp.now,
            )

        @sp.onchain_view()
        def get_record(self, record_id: sp.string) -> sp.option[record_type]:
            # Return optional record: Some(record) if found, None if missing
            return self.data.records.get_opt(record_id)


# ==============================================================================
# TEST SCENARIO (SIMULATION ONLY)
# Uses sp.test_account only for simulated testing.
# ==============================================================================
@sp.add_test()
def test_document_registry():
    scenario = sp.test_scenario("DocumentRegistry_Tests", main)
    scenario.h1("Document Integrity Registry Tests")

    admin = sp.test_account("admin")
    non_admin = sp.test_account("non_admin")

    contract = main.DocumentRegistry(admin=admin.address)
    scenario += contract

    # 1. Non-admin registration must fail
    scenario.h2("1. Non-admin registration fails")
    contract.register(
        record_id="123e4567-e89b-12d3-a456-426614174000",
        label="Club Charter",
        sha256="b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
        _sender=non_admin,
        _valid=False,
        _exception="UNAUTHORIZED: Sender is not admin",
    )

    # 2. Querying a missing record ID returns None
    scenario.h2("2. Query missing record returns None")
    scenario.verify(contract.get_record("123e4567-e89b-12d3-a456-426614174000") == None)

    # 3. Admin calls register with valid parameters
    scenario.h2("3. Admin successfully registers document")
    record_id_1 = "123e4567-e89b-12d3-a456-426614174000"
    label_1 = "Club Charter 2026"
    sha256_1 = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

    contract.register(
        record_id=record_id_1,
        label=label_1,
        sha256=sha256_1,
        _sender=admin,
        _now=sp.timestamp(1000),
    )

    # 4. Verify stored fields in contract storage
    scenario.h2("4. Verify stored fields in contract data")
    scenario.verify(contract.data.records[record_id_1].label == label_1)
    scenario.verify(contract.data.records[record_id_1].sha256 == sha256_1)
    scenario.verify(contract.data.records[record_id_1].registrar == admin.address)
    scenario.verify(contract.data.records[record_id_1].registered_at == sp.timestamp(1000))

    # 5. Verify get_record on-chain view result
    scenario.h2("5. Verify get_record on-chain view returns Some(record)")
    expected_record = sp.record(
        label=label_1,
        sha256=sha256_1,
        registrar=admin.address,
        registered_at=sp.timestamp(1000),
    )
    scenario.verify(contract.get_record(record_id_1) == sp.Some(expected_record))

    # 6. Registering a duplicate record ID must fail
    scenario.h2("6. Duplicate record ID registration fails")
    contract.register(
        record_id=record_id_1,
        label="Duplicate Attempt",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        _sender=admin,
        _valid=False,
        _exception="RECORD_EXISTS: Record ID already registered",
    )


# ==============================================================================
# DEPLOYMENT TARGET (REAL TEMPLE WALLET SETUP)
# ==============================================================================
# Replace this address with your real Temple public address (e.g., tz1...)
# when deploying to Tezos Shadownet.
DEPLOYMENT_ADMIN_ADDRESS: sp.address = sp.address("tz1dmo2H7rmwf8KGx11oQhqHda51iE6t1das")

@sp.add_test()
def deployment_target():
    """
    Dedicated deployment target.
    Initializes DocumentRegistry with DEPLOYMENT_ADMIN_ADDRESS (real Temple address)
    instead of test accounts. In the SmartPy IDE / compiler, select this scenario
    to compile Michelson code and originate the contract to Shadownet.
    """
    scenario = sp.test_scenario("DocumentRegistry_Deployment", main)
    scenario.h1("Deployment Target - Real Temple Admin")
    deployed_contract = main.DocumentRegistry(admin=DEPLOYMENT_ADMIN_ADDRESS)
    scenario += deployed_contract
