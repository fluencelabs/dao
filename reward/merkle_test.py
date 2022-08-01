import unittest
from hexbytes import HexBytes
import merkle

class TestUM(unittest.TestCase):
    def test_create_leafs(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x81Bc596b7938b26cBb8842369dD6049470a896d1"
        ]
        assert (
            merkle.create_leafs(v) == [
                HexBytes('0xc4a503ecd6579087f0941171a61b494ff21fc3d3bd89b568b7f5fc515c30c9cf'), 
                HexBytes('0xbc45a5a89dc36a3468c19b9a11ea32a3663bea50182b70bfd2520018ac5dcb87'), 
                HexBytes('0x3ee84b5eacff70b86b03ff3ba618d46b16083504ec24e7256258932cc8c2818b')
            ]
        )

    def test_hash_nodes_one(self):
        v = [
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000005"),
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000001"),
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000003")
        ]
        assert (
            merkle.hash_nodes(v)  == [
                HexBytes('0x1471eb6eb2c5e789fc3de43f8ce62938c7d1836ec861730447e2ada8fd81017b'), 
                HexBytes('0x0000000000000000000000000000000000000000000000000000000000000003')
            ]
        )

    def test_hash_nodes_two(self):
        v = [
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000000"),
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000001"),
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000003"),
            HexBytes.fromhex("0000000000000000000000000000000000000000000000000000000000000002")
        ]
        assert (
            merkle.hash_nodes(v)  == [
                HexBytes('0xa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49'), 
                HexBytes('0xc3a24b0501bd2c13a7e57f2db4369ec4c223447539fc0724a9d55ac4a06ebd4d')
            ]
        )

    def test_gen_merkle_root_one(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1"
        ]
        assert (merkle.gen_merkle_root(v) == "0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0")

    def test_gen_merkle_root_two(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA"
        ]
        assert (merkle.gen_merkle_root(v) == "0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215")
    
    def test_gen_merkle_root_three(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA",
            "0xbE51f9928E498D018C18940FD1EbDBB04F493a45",
            "0x4Ee1279a8B1b553c25E008222A25e7FAb6feD1Df"
        ]
        assert (merkle.gen_merkle_root(v) == "0x7af560a7d579b81a0d8058bdb07e0700e5fcc454dcc115c97732d644ae53311e")
    
    def test_gen_merkle_root_tour(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA",
            "0xbE51f9928E498D018C18940FD1EbDBB04F493a45",
            "0x4Ee1279a8B1b553c25E008222A25e7FAb6feD1Df",
            "0x7d95dc520960c65cfd484c2b8a1Ca98f358dEe97"
        ]
        assert (merkle.gen_merkle_root(v) == "0xca22b62c1dec6b20d7fedfe1b9493820b37ae3a0d8ced44d8b1010f49cdc4ea4")

    def test_gen_merkle_root_tour(self):
        v = [
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA",
            "0xbE51f9928E498D018C18940FD1EbDBB04F493a45",
            "0x4Ee1279a8B1b553c25E008222A25e7FAb6feD1Df",
            "0x7d95dc520960c65cfd484c2b8a1Ca98f358dEe97"
        ]

        proof = [
            [HexBytes('0xbc45a5a89dc36a3468c19b9a11ea32a3663bea50182b70bfd2520018ac5dcb87'), HexBytes('0xa844d8f54d8dc953b9d13f43b95742b5cb0712443ba7c33bcfaa9c209f7cf19c'), HexBytes('0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b')],
            [HexBytes('0xc4a503ecd6579087f0941171a61b494ff21fc3d3bd89b568b7f5fc515c30c9cf'), HexBytes('0xa844d8f54d8dc953b9d13f43b95742b5cb0712443ba7c33bcfaa9c209f7cf19c'), HexBytes('0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b')],
            [HexBytes('0x8947e7ab682c7d402e889271e9333fc051155de32cedef16a0741a8228dc5898'), HexBytes('0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0'), HexBytes('0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b')],
            [HexBytes('0x96e4c59ff58c1dcff7a752e2bef32872dcf4483ee3f644712227b8bdea8e3728'), HexBytes('0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0'), HexBytes('0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b')],
            [HexBytes('0x0d320c659ea58a0484e165d72a74f14fb585b3392b8e710505189e53237333de'), HexBytes('0x1df7016ec5c60da03645f1a7d903b14b22141f95f011985cb523bfced9192add'), HexBytes('0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215')],
            [HexBytes('0x5a3104971f7ca552ee2642261e3f07f1f4b8e3924aa57780b5073fbdb9c52a17'), HexBytes('0x1df7016ec5c60da03645f1a7d903b14b22141f95f011985cb523bfced9192add'), HexBytes('0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215')],
            [HexBytes('0x6b880130824f6949ea52dda329400da062b8db6ac376840cd144874be081bb53'), HexBytes('0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215')]
        ]
        for i, _ in enumerate(v):
            _, p = merkle.gen_merkle_proof(v, i)
            assert p == proof[i]

if __name__ == '__main__':
    unittest.main()