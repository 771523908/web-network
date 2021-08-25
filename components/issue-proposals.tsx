import { useContext } from "react";
import clsx from "clsx";
import { toNumber } from "lodash";
import { GetStaticProps } from "next";
import { useEffect, useState } from "react";
import GithubMicroService, {
  ProposalMicroService,
} from "@services/github-microservice";
import { BeproService } from "@services/bepro-service";
import { ApplicationContext } from "@contexts/application";
import { changeLoadState } from "@contexts/reducers/change-load-state";
import router from "next/router";
import { handlePercentage } from "@helpers/handlePercentage";

interface Proposal {
  disputes: string;
  prAddresses: string[];
  prAmounts: number[];
  proposalAddress: string;
  votes: string;
  _id: string;
  isDisputed?: boolean;
  pullRequestId?: string;
  pullRequestGithubId?: string;
}

export default function IssueProposals({ numberProposals, issueId, amount }) {
  const { dispatch } = useContext(ApplicationContext);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const ProgressBallRightInitial = 81.7;

  const handleDispute = async (mergeId) => {
    dispatch(changeLoadState(true));
    await BeproService.network
      .disputeMerge({
        issueID: issueId,
        mergeID: mergeId,
      })
      .then(() => gets())
      .catch((err) => console.log("err dispute", err))
      .finally(() => dispatch(changeLoadState(false)));
  };

  const calcProgressBallright = (value: number) => {
    const InitialLimit = ProgressBallRightInitial;
    const FinalLimit = 88.67;
    return ((value - InitialLimit) * 100) / (FinalLimit - InitialLimit);
  };

  const calcAmountProgressBallLeft = (value: number) => {
    return (value * 7) / 100;
  };

  const gets = async () => {
    const pool = [];
    if (issueId)
      for (var i = 0; i < numberProposals; i++) {
        const merge = await BeproService.network.getMergeById({
          issue_id: issueId,
          merge_id: i,
        });
        await BeproService.network
          .isMergeDisputed({
            issueId: issueId,
            mergeId: i,
          })
          .then((isMergeDisputed) => (merge.isDisputed = isMergeDisputed))
          .catch((err) => console.log("err is merge disputed", err));
        await GithubMicroService.getMergeProposalIssue(
          issueId,
          (i + 1).toString()
        )
          .then((mergeProposal: ProposalMicroService) => {
            merge.pullRequestId = mergeProposal.pullRequestId;
            merge.pullRequestGithubId = mergeProposal.pullRequest.githubId;
          })
          .catch((err) => console.log("err microService", err));

        pool.push(merge);
      }
    if (pool.length === numberProposals) setProposals(pool);
  };

  useEffect(() => {
    gets();
  }, [issueId, numberProposals]);

  const renderProposals = () => {
    return proposals.map((proposal) => (
      <div className="content-list-item" key={proposal._id}>
        <div className="list-item-proposal rounded row align-items-center">
          <div
            className="col-md-4 mt-3"
            onClick={() => {
              router.push({
                pathname: "/proposal",
                query: { id: proposal.pullRequestId, issueId: issueId },
              });
            }}
          >
            <p
              className={clsx("p-small mb-0", {
                "text-danger": proposal?.isDisputed,
              })}
            >
              PR #{proposal.pullRequestGithubId}
            </p>
          </div>
          <div className="col-md-4">
            <div className="content-proposals p-0 mb-2">
              <div className="d-flex">
                {proposal.prAmounts.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex flex-column bd-highlight mt-4 me-2"
                    style={{
                      width: `${handlePercentage(toNumber(item), amount)}%`,
                    }}
                  >
                    <div className="bd-highlight">
                      <p
                        className={clsx("p-small mb-0", {
                          "text-danger": proposal?.isDisputed,
                          "color-purple": !proposal?.isDisputed,
                        })}
                      >
                        {handlePercentage(toNumber(item), amount)}%
                      </p>
                    </div>

                    <div
                      className={clsx("proposal-progress  bd-highlight", {
                        "bg-danger": proposal?.isDisputed,
                        "bg-purple": !proposal?.isDisputed,
                      })}
                      key={index}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex align-items-center justify-content-end">
              <div className="d-flex flex-column bd-highlight mr-2">
                <div className="d-flex align-items-stretch mb-0 ">
                  <p
                    className={clsx("smallCaption mb-0", {
                      "text-danger": proposal?.isDisputed,
                      "color-purple": !proposal?.isDisputed,
                    })}
                  >
                    {proposal.disputes}
                  </p>
                  <p className="smallCaption mb-0">/{amount} Oracles</p>
                </div>
                <div className="content-relative">
                  <div className="progress progress-oracle my-1">
                    <div
                      className={clsx("progress-bar ", {
                        "bg-danger": proposal?.isDisputed,
                        "bg-purple": !proposal?.isDisputed,
                      })}
                      role="progressbar"
                      style={{
                        width: `${handlePercentage(
                          toNumber(proposal.disputes),
                          amount
                        )}%`,
                      }}
                    >
                      <div className="progress progress-ball left">
                        <div
                          className={clsx("progress-bar", {
                            "bg-danger": proposal?.isDisputed,
                            "bg-purple": !proposal?.isDisputed,
                          })}
                          role="progressbar"
                          style={{
                            width: `${handlePercentage(
                              toNumber(proposal.disputes),
                              calcAmountProgressBallLeft(amount)
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="progress progress-ball right">
                        <div
                          className={clsx("progress-bar", {
                            "bg-danger": proposal?.isDisputed,
                            "bg-purple": !proposal?.isDisputed,
                          })}
                          role="progressbar"
                          style={{
                            width: `${
                              handlePercentage(
                                toNumber(proposal.disputes),
                                amount
                              ) >= ProgressBallRightInitial &&
                              calcProgressBallright(
                                handlePercentage(
                                  toNumber(proposal.disputes),
                                  amount
                                )
                              )
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center">
                  <p
                    className={clsx("smallCaption  mb-0", {
                      "text-danger": proposal?.isDisputed,
                      "color-purple": !proposal?.isDisputed,
                    })}
                  >
                    {handlePercentage(
                      toNumber(proposal.disputes),
                      amount
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-end ms-2">
                {!proposal?.isDisputed ? (
                  <button
                    className="btn btn-md btn-purple p-3"
                    onClick={() => handleDispute(toNumber(proposal._id))}
                  >
                    Dispute
                  </button>
                ) : (
                  <button className="btn btn-outline-danger me-1">
                    Failed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="content-wrapper mb-4 pb-0">
            <h3 className="smallCaption pb-3">{numberProposals} Proposals</h3>
            {renderProposals()}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};
