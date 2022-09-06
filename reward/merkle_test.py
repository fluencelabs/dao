import unittest
from hexbytes import HexBytes
from helpers.merkle import MerkleTree


class Test(unittest.TestCase):
    def test_gen_merkle_root_one(self):
        tree = MerkleTree([
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1"
        ])

        self.assertEqual(
            tree.get_root(),
            "0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0"
        )

    def test_gen_merkle_root_two(self):
        tree = MerkleTree([
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA"
        ])

        self.assertEqual(
            tree.get_root(),
            "0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215"
        )

    def test_gen_merkle_root_three(self):
        tree = MerkleTree([
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA",
            "0xbE51f9928E498D018C18940FD1EbDBB04F493a45",
            "0x4Ee1279a8B1b553c25E008222A25e7FAb6feD1Df"
        ])
        self.assertEqual(
            tree.get_root(),
            "0x7af560a7d579b81a0d8058bdb07e0700e5fcc454dcc115c97732d644ae53311e"
        )

    def test_gen_merkle_root_tour(self):
        tree = MerkleTree([
            "0xbb9c914731A9AA3E222e28d703cf4A4165747572",
            "0x30fc86c1802f67610DA9180D55426c314ae33DF1",
            "0x1bF09865467eE989b25b8177801bb14b758CA1EA",
            "0xFCED23957E60AcCc949BF021Ee4e98941c3A6EeA",
            "0xbE51f9928E498D018C18940FD1EbDBB04F493a45",
            "0x4Ee1279a8B1b553c25E008222A25e7FAb6feD1Df",
            "0x7d95dc520960c65cfd484c2b8a1Ca98f358dEe97"
        ])
        self.assertEqual(
            tree.get_root(),
            "0xca22b62c1dec6b20d7fedfe1b9493820b37ae3a0d8ced44d8b1010f49cdc4ea4"
        )

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

        tree = MerkleTree(v)
        self.assertEqual(
            tree.get_root(),
            "0xca22b62c1dec6b20d7fedfe1b9493820b37ae3a0d8ced44d8b1010f49cdc4ea4"
        )

        proof = [
            [
                '0xbc45a5a89dc36a3468c19b9a11ea32a3663bea50182b70bfd2520018ac5dcb87',
                '0xa844d8f54d8dc953b9d13f43b95742b5cb0712443ba7c33bcfaa9c209f7cf19c',
                '0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b'
            ],
            [
                '0xc4a503ecd6579087f0941171a61b494ff21fc3d3bd89b568b7f5fc515c30c9cf',
                '0xa844d8f54d8dc953b9d13f43b95742b5cb0712443ba7c33bcfaa9c209f7cf19c',
                '0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b'
            ],
            [
                '0x8947e7ab682c7d402e889271e9333fc051155de32cedef16a0741a8228dc5898',
                '0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0',
                '0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b'
            ],
            [
                '0x96e4c59ff58c1dcff7a752e2bef32872dcf4483ee3f644712227b8bdea8e3728',
                '0xe03d95e6572c9c3d1dc2f310b0148dca89d08d9b8b8459cdc2667344615994d0',
                '0xb080c317578e3a66a257cc14a7ea807b31f4f5ba0a8afefc9a3a9e4de7e2e02b'
            ],
            [
                '0x0d320c659ea58a0484e165d72a74f14fb585b3392b8e710505189e53237333de',
                '0x1df7016ec5c60da03645f1a7d903b14b22141f95f011985cb523bfced9192add',
                '0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215'
            ],
            [
                '0x5a3104971f7ca552ee2642261e3f07f1f4b8e3924aa57780b5073fbdb9c52a17',
                '0x1df7016ec5c60da03645f1a7d903b14b22141f95f011985cb523bfced9192add',
                '0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215'
            ],
            [
                '0x6b880130824f6949ea52dda329400da062b8db6ac376840cd144874be081bb53',
                '0x7d29796cd53c0443e4e879329070e45ee2b926c6ac4739540a0091b26c816215'
            ]
        ]

        for i, _ in enumerate(v):
            p = tree.get_proof(i)
            self.assertEqual(p, proof[i])


if __name__ == '__main__':
    unittest.main()
